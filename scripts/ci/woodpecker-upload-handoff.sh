#!/usr/bin/env bash
# Copy one trusted worker's flat output to its role-restricted SFTP inbox.
set -euo pipefail
# A repackaged handoff (--repackaged-by <pipeline>) keeps the build's identity: <source> and <pipeline>
# are the build source and build pipeline. This pipeline and its root commit, a packaging-only
# descendant of the source, are recorded as packaged_by and packaged_by_commit.
usage='usage: woodpecker-upload-handoff.sh <linux|macos|windows> <output-dir> <source> <compiler> <version> <pipeline> [--repackaged-by <pipeline>]'
[[ "$#" == 6 || ( "$#" == 8 && "$7" == --repackaged-by ) ]] || { echo "$usage" >&2; exit 2; }
role="$1"; output="$2"; source="$3"; compiler="$4"; version="$5"; run="$6"; packaged_by="${8:-}"
case "$role" in linux|macos|windows) ;; *) echo 'invalid handoff role' >&2; exit 2;; esac
[[ "$source" =~ ^[a-f0-9]{40}$ && "$compiler" =~ ^[a-f0-9]{40}$ && "$run" =~ ^[1-9][0-9]*$ && "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || { echo 'invalid handoff identity' >&2; exit 2; }
[[ -z "$packaged_by" || ( "$packaged_by" =~ ^[1-9][0-9]*$ && "$packaged_by" != "$run" ) ]] || { echo 'invalid repackaging pipeline' >&2; exit 2; }
[[ "${CI_PIPELINE_EVENT:-}" == manual || "${CI_PIPELINE_EVENT:-}" == tag ]] || { echo 'handoff requires trusted manual or tag pipeline' >&2; exit 1; }
head="$(git rev-parse HEAD)"
if [[ -z "$packaged_by" ]]; then
  [[ "${CI_PIPELINE_NUMBER:-}" == "$run" && "${CI_COMMIT_SHA:-}" == "$source" && "$head" == "$source" ]] || { echo 'handoff identity is not this pipeline checkout' >&2; exit 1; }
else
  [[ "${CI_PIPELINE_EVENT:-}" == manual && "${CI_PIPELINE_NUMBER:-}" == "$packaged_by" && "${CI_COMMIT_SHA:-}" == "$head" ]] || { echo 'repackaging identity is not this pipeline checkout' >&2; exit 1; }
  [[ "$(git rev-parse "$source:compiler")" == "$compiler" ]] || { echo 'handoff compiler is not the build source compiler pointer' >&2; exit 1; }
  node "$(dirname "$0")/release-user-observation.mjs" --packaging-root "$(git rev-parse --show-toplevel)" "$source" "$head" "$head" >/dev/null || {
    echo 'repackaging root is not a packaging-only descendant of the build source' >&2; exit 1;
  }
fi
ssh_key="${BESKID_HANDOFF_SSH_KEY:-/etc/woodpecker/handoff/${role}.sftp}"
known_hosts="${BESKID_HANDOFF_KNOWN_HOSTS:-/etc/woodpecker/handoff/known_hosts}"
host="${BESKID_HANDOFF_HOST:-bdziam.dev}"; user="${BESKID_HANDOFF_USER:-beskid-${role}}"
[[ -d "$output" && -f "$ssh_key" && -f "$known_hosts" ]] || { echo 'handoff output or host-managed SFTP credentials are unavailable' >&2; exit 1; }
find "$output" -mindepth 1 -maxdepth 1 -type l -print -quit | grep -q . && { echo 'symlinked handoff file rejected' >&2; exit 1; }
capsule="$(mktemp -d)"; batch="$(mktemp)"; files="$(mktemp)"; trap 'rm -rf "$capsule" "$batch" "$files"' EXIT
while IFS= read -r -d '' entry; do name="$(basename "$entry")"; [[ "$name" =~ ^[A-Za-z0-9][A-Za-z0-9._-]*$ ]] || { echo 'unsafe SFTP artifact name rejected' >&2; exit 1; }; [[ "$name" != UPLOAD_* ]] || { echo 'reserved UPLOAD_* output name rejected' >&2; exit 1; }; cp "$entry" "$capsule/$name"; done < <(find "$output" -mindepth 1 -maxdepth 1 -type f -print0)
find "$capsule" -mindepth 1 -maxdepth 1 -type f -exec basename {} \; | LC_ALL=C sort >"$files"
[[ -s "$files" ]] || { echo 'handoff output contains no regular files' >&2; exit 1; }
while IFS= read -r name; do (cd "$capsule" && if command -v sha256sum >/dev/null; then sha256sum "$name"; else shasum -a 256 "$name"; fi); done <"$files" >"$capsule/UPLOAD_SHA256SUMS"
printf 'role=%s\nsource=%s\ncompiler=%s\nversion=%s\npipeline=%s\n' "$role" "$source" "$compiler" "$version" "$run" >"$capsule/UPLOAD_COMPLETE"
[[ -z "$packaged_by" ]] || printf 'packaged_by=%s\npackaged_by_commit=%s\n' "$packaged_by" "$head" >>"$capsule/UPLOAD_COMPLETE"
remote="/incoming/${run}-${source}/${role}"
printf 'mkdir "%s"\nmkdir "%s"\n' "/incoming/${run}-${source}" "$remote" >"$batch"
while IFS= read -r name; do printf 'put "%s" "%s/%s"\n' "$capsule/$name" "$remote" "$name"; done <"$files" >>"$batch"
printf 'put "%s" "%s/UPLOAD_SHA256SUMS"\nput "%s" "%s/UPLOAD_COMPLETE"\n' "$capsule/UPLOAD_SHA256SUMS" "$remote" "$capsule/UPLOAD_COMPLETE" "$remote" >>"$batch"
# Quote the path inside the OpenSSH option value as well as at the shell
# boundary. OpenSSH reparses -o values, so an unquoted macOS Application
# Support path is otherwise split even though the shell passed one argument.
sftp -b "$batch" -i "$ssh_key" -oBatchMode=yes -oStrictHostKeyChecking=yes \
  -o "UserKnownHostsFile=\"$known_hosts\"" "$user@$host"
