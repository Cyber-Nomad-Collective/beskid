#!/usr/bin/env bash
# Collect the release candidate: for one source commit, select and fetch one complete, verified build
# handoff per platform through the read-only release SFTP account.
#
# Usage: woodpecker-fetch-handoffs.sh <source-sha|linux-sha,macos-sha,windows-sha> <compiler-sha> <version> <destination>
#
# One source names the commit of all three handoffs. Three comma-separated sources name each platform's
# own source commit (linux, macos, windows); release-user-observation.mjs --platform-sources has already
# proven that they share one build identity.
#
# Each platform is built by its own pipeline (BESKID_TASK=build-<platform>, or all three with
# BESKID_TASK=build), so the three handoffs of one candidate can carry different pipeline numbers.
# For every platform the newest handoff `/<role>/incoming/<pipeline>-<source>/<role>` whose
# UPLOAD_COMPLETE marker is present is selected; a handoff without the marker is an unfinished or failed
# upload and is skipped. BESKID_LINUX_BUILD, BESKID_MACOS_BUILD and BESKID_WINDOWS_BUILD pin a platform
# to one pipeline number instead. A complete handoff of another release version is skipped.
#
# Fail closed: a platform without a complete handoff of the source, a pinned pipeline without one, a
# selected marker whose role, source, compiler or pipeline differs, or a checksum mismatch stops the
# collection. It never falls back to an older handoff after a selected one fails verification.
#
# On success the destination holds `<role>/incoming/<pipeline>-<source>/<role>` for the three
# platforms, and stdout carries the selected pipeline numbers: `<linux> <macos> <windows>`.
set -euo pipefail

[[ "$#" == 4 ]] || { echo 'usage: woodpecker-fetch-handoffs.sh <source-sha|linux-sha,macos-sha,windows-sha> <compiler-sha> <version> <destination>' >&2; exit 2; }
source_arg="$1"; compiler_sha="$2"; version="$3"; destination="$4"
roles=(linux macos windows)
declare -A sources=()
if [[ "$source_arg" =~ ^([a-f0-9]{40}),([a-f0-9]{40}),([a-f0-9]{40})$ ]]; then
  sources[linux]="${BASH_REMATCH[1]}"; sources[macos]="${BASH_REMATCH[2]}"; sources[windows]="${BASH_REMATCH[3]}"
elif [[ "$source_arg" =~ ^[a-f0-9]{40}$ ]]; then
  for role in "${roles[@]}"; do sources[$role]="$source_arg"; done
else
  echo 'invalid handoff identity' >&2; exit 2
fi
[[ "$compiler_sha" =~ ^[a-f0-9]{40}$ && "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || {
  echo 'invalid handoff identity' >&2; exit 2
}
declare -A pins=()
for role in "${roles[@]}"; do
  variable="BESKID_${role^^}_BUILD"
  pin="${!variable:-}"
  if [[ -n "$pin" ]]; then
    [[ "$pin" =~ ^[1-9][0-9]*$ ]] || { echo "$variable must be a positive pipeline number" >&2; exit 2; }
    pins[$role]="$pin"
  fi
done
[[ ! -e "$destination" ]] || { echo 'handoff destination must not already exist' >&2; exit 1; }

scripts="$(cd "$(dirname "$0")" && pwd)"
ssh_key="${BESKID_RELEASE_SSH_KEY:-/etc/woodpecker/handoff/release.sftp}"
known_hosts="${BESKID_HANDOFF_KNOWN_HOSTS:-/etc/woodpecker/handoff/known_hosts}"
host="${BESKID_HANDOFF_HOST:-bdziam.dev}"
user="${BESKID_RELEASE_SFTP_USER:-beskid-release}"
[[ -f "$ssh_key" && -f "$known_hosts" ]] || {
  echo 'host-managed release SFTP credentials are unavailable' >&2; exit 1
}

staged="$(mktemp -d)"; trap 'rm -rf "$staged"' EXIT
# Batch output goes to stdout; callers read only the selection from this script's stdout.
run_batch() {
  sftp -b "$1" -i "$ssh_key" -oBatchMode=yes -oStrictHostKeyChecking=yes \
    -o "UserKnownHostsFile=\"$known_hosts\"" "$user@$host"
}

# 1. Discovery: the handoff capsules of this source in each role inbox, newest pipeline first.
declare -A candidates=()
for role in "${roles[@]}"; do
  printf 'ls -1 "/%s/incoming"\n' "$role" >"$staged/list-$role.batch"
  listing="$(run_batch "$staged/list-$role.batch")"
  found="$(while IFS= read -r entry; do
      entry="${entry%"${entry##*[![:space:]]}"}"; entry="${entry##*/}"
      if [[ "$entry" =~ ^([1-9][0-9]*)-${sources[$role]}$ ]]; then printf '%s\n' "${BASH_REMATCH[1]}"; fi
    done <<<"$listing" | sort -rn -u)"
  if [[ -n "${pins[$role]:-}" ]]; then
    grep -Fxq -- "${pins[$role]}" <<<"$found" || {
      echo "no $role handoff from pipeline ${pins[$role]} for source ${sources[$role]}" >&2; exit 1
    }
    found="${pins[$role]}"
  fi
  [[ -n "$found" ]] || { echo "no $role handoff for source ${sources[$role]}" >&2; exit 1; }
  candidates[$role]="$found"
done

# 2. Completion markers only; an absent marker is an unfinished upload.
mkdir "$staged/markers"
: >"$staged/markers.batch"
for role in "${roles[@]}"; do
  while IFS= read -r run; do
    printf -- '-get "/%s/incoming/%s-%s/%s/UPLOAD_COMPLETE" "%s/markers/%s-%s"\n' \
      "$role" "$run" "${sources[$role]}" "$role" "$staged" "$role" "$run" >>"$staged/markers.batch"
  done <<<"${candidates[$role]}"
done
run_batch "$staged/markers.batch" >/dev/null

# 3. Selection: the newest complete handoff of this release; identity drift fails closed.
declare -A selected=()
for role in "${roles[@]}"; do
  while IFS= read -r run; do
    marker="$staged/markers/$role-$run"
    if [[ ! -f "$marker" ]]; then
      echo "skipping incomplete $role handoff from pipeline $run" >&2; continue
    fi
    fields="$(node "$scripts/woodpecker-handoff.mjs" marker "$marker")" || {
      echo "$role handoff from pipeline $run has an invalid completion marker" >&2; exit 1
    }
    node - "$fields" "$role" "${sources[$role]}" "$compiler_sha" "$run" <<'NODE' || { echo "$role handoff from pipeline $run is not a build of source ${sources[$role]}" >&2; exit 1; }
const [fields, role, source, compiler, pipeline] = process.argv.slice(2), marker = JSON.parse(fields);
const expected = { role, source, compiler, pipeline };
for (const [key, value] of Object.entries(expected)) if (marker[key] !== value) { console.error(`UPLOAD_COMPLETE ${key} is ${marker[key]}, expected ${value}`); process.exit(1); }
NODE
    marker_version="$(node -e 'process.stdout.write(JSON.parse(process.argv[1]).version)' "$fields")"
    if [[ "$marker_version" != "$version" ]]; then
      echo "skipping $role handoff from pipeline $run: it is a $marker_version build" >&2; continue
    fi
    selected[$role]="$run"; break
  done <<<"${candidates[$role]}"
  [[ -n "${selected[$role]:-}" ]] || {
    echo "no complete $role handoff of $version for source ${sources[$role]}" >&2; exit 1
  }
done

# 4. Fetch the selected handoffs and verify every checksum before they become visible.
: >"$staged/fetch.batch"
for role in "${roles[@]}"; do
  mkdir -p "$staged/handoff/$role/incoming"
  printf 'get -R "/%s/incoming/%s-%s" "%s/handoff/%s/incoming/"\n' \
    "$role" "${selected[$role]}" "${sources[$role]}" "$staged" "$role" >>"$staged/fetch.batch"
done
run_batch "$staged/fetch.batch" >/dev/null
for role in "${roles[@]}"; do
  incoming="$staged/handoff/$role/incoming/${selected[$role]}-${sources[$role]}/$role"
  test -d "$incoming" || { echo "missing fetched $role handoff" >&2; exit 1; }
  node "$scripts/woodpecker-handoff.mjs" validate "$incoming" "$role" "${sources[$role]}" "$compiler_sha" \
    "$version" "${selected[$role]}" >/dev/null
  echo "selected $role handoff from pipeline ${selected[$role]}" >&2
done
mv "$staged/handoff" "$destination"
printf '%s %s %s\n' "${selected[linux]}" "${selected[macos]}" "${selected[windows]}"
