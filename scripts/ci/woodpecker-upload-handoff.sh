#!/usr/bin/env bash
# Copy one trusted worker's flat output to its role-restricted SFTP inbox.
set -euo pipefail
# A repackaged handoff (--repackaged-by <pipeline>) keeps the build's identity: <source> and <pipeline>
# are the build source and build pipeline. This pipeline and its root commit, a packaging-only
# descendant of the source, are recorded as packaged_by and packaged_by_commit.
#
# A repackage that supersedes the current packaging of the same build (--supersedes <pipeline>, the
# packaged_by of the current handoff, or the build pipeline when the build packaged itself) never
# overwrites that handoff: it reads the build's entries in this inbox, requires the named packaging to
# be the current one (woodpecker-handoff.mjs resolve), and uploads to the new entry
# `/incoming/<pipeline>-<source>@<packaged_by>/<role>`. Its UPLOAD_COMPLETE adds supersedes and
# supersedes_commit, the superseded packaging's pipeline and root commit.
usage='usage: woodpecker-upload-handoff.sh <linux|macos|windows> <output-dir> <source> <compiler> <version> <pipeline> [--repackaged-by <pipeline> [--supersedes <pipeline>]]'
[[ "$#" == 6 || ( "$#" == 8 && "$7" == --repackaged-by ) || ( "$#" == 10 && "$7" == --repackaged-by && "$9" == --supersedes ) ]] || { echo "$usage" >&2; exit 2; }
role="$1"; output="$2"; source="$3"; compiler="$4"; version="$5"; run="$6"; packaged_by="${8:-}"; supersedes="${10:-}"
case "$role" in linux|macos|windows) ;; *) echo 'invalid handoff role' >&2; exit 2;; esac
[[ "$source" =~ ^[a-f0-9]{40}$ && "$compiler" =~ ^[a-f0-9]{40}$ && "$run" =~ ^[1-9][0-9]*$ && "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || { echo 'invalid handoff identity' >&2; exit 2; }
[[ -z "$packaged_by" || ( "$packaged_by" =~ ^[1-9][0-9]*$ && "$packaged_by" != "$run" ) ]] || { echo 'invalid repackaging pipeline' >&2; exit 2; }
[[ -z "$supersedes" || ( "$supersedes" =~ ^[1-9][0-9]*$ && "$supersedes" -ge "$run" && "$supersedes" -lt "$packaged_by" ) ]] || {
  echo 'the superseded packaging must be the build pipeline or an earlier repackaging pipeline' >&2; exit 2;
}
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
sftp_batch() {
  # Quote the path inside the OpenSSH option value as well as at the shell
  # boundary. OpenSSH reparses -o values, so an unquoted macOS Application
  # Support path is otherwise split even though the shell passed one argument.
  sftp -b "$1" -i "$ssh_key" -oBatchMode=yes -oStrictHostKeyChecking=yes \
    -o "UserKnownHostsFile=\"$known_hosts\"" "$user@$host"
}
entry="${run}-${source}"
if [[ -n "$supersedes" ]]; then
  entry="${run}-${source}@${packaged_by}"
  markers="$capsule.markers"; mkdir "$markers"; trap 'rm -rf "$capsule" "$batch" "$files" "$markers"' EXIT
  printf 'ls -1 "/incoming"\n' >"$batch"
  existing="$(sftp_batch "$batch" | while IFS= read -r name; do
      name="${name%"${name##*[![:space:]]}"}"; name="${name##*/}"
      if [[ "$name" =~ ^${run}-${source}(@[1-9][0-9]*)?$ ]]; then printf '%s\n' "$name"; fi
    done | LC_ALL=C sort -u)" || { echo "cannot list the ${role} inbox" >&2; exit 1; }
  ! grep -Fxq -- "$entry" <<<"$existing" || { echo "handoff $entry already exists" >&2; exit 1; }
  : >"$batch"
  while IFS= read -r name; do
    [[ -z "$name" ]] || printf -- '-get "/incoming/%s/%s/UPLOAD_COMPLETE" "%s/%s"\n' "$name" "$role" "$markers" "$name" >>"$batch"
  done <<<"$existing"
  [[ ! -s "$batch" ]] || sftp_batch "$batch" >/dev/null
  # Word splitting is safe: entry names match ^<run>-<source>(@<pipeline>)?$.
  # shellcheck disable=SC2086
  current="$(node "$(dirname "$0")/woodpecker-handoff.mjs" resolve "$markers" "$role" "$source" "$compiler" "$run" $existing)" || exit 1
  current_pipeline="$(node -e 'const r=JSON.parse(process.argv[1]);process.stdout.write(r.selected?String(r.selected.packaging.pipeline):"")' "$current")"
  current_commit="$(node -e 'const r=JSON.parse(process.argv[1]);process.stdout.write(r.selected?r.selected.packaging.commit:"")' "$current")"
  [[ -n "$current_pipeline" ]] || { echo "build ${run} has no complete ${role} handoff to supersede" >&2; exit 1; }
  [[ "$current_pipeline" == "$supersedes" ]] || {
    echo "--supersedes ${supersedes} does not name the current ${role} handoff of build ${run}, packaged by pipeline ${current_pipeline}" >&2; exit 1;
  }
  # The repackage provenance names the superseded local packaging; it must be this one.
  if [[ -f "$capsule/repackage-provenance.json" ]]; then
    node -e 'const p=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")).supersedes;if(!p||String(p.pipeline)!==process.argv[2]||p.superrepo_commit!==process.argv[3])process.exit(1)' \
      "$capsule/repackage-provenance.json" "$supersedes" "$current_commit" || {
      echo "repackage provenance does not supersede packaging ${supersedes} (${current_commit})" >&2; exit 1;
    }
  fi
  printf 'supersedes=%s\nsupersedes_commit=%s\n' "$supersedes" "$current_commit" >>"$capsule/UPLOAD_COMPLETE"
fi
remote="/incoming/${entry}/${role}"
printf 'mkdir "%s"\nmkdir "%s"\n' "/incoming/${entry}" "$remote" >"$batch"
while IFS= read -r name; do printf 'put "%s" "%s/%s"\n' "$capsule/$name" "$remote" "$name"; done <"$files" >>"$batch"
printf 'put "%s" "%s/UPLOAD_SHA256SUMS"\nput "%s" "%s/UPLOAD_COMPLETE"\n' "$capsule/UPLOAD_SHA256SUMS" "$remote" "$capsule/UPLOAD_COMPLETE" "$remote" >>"$batch"
sftp_batch "$batch"
