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
# A build's installers may be repackaged more than once. The first packaging is the handoff
# `<pipeline>-<source>/<role>`; a repackage that supersedes it is uploaded beside it as
# `<pipeline>-<source>@<packaging-pipeline>/<role>`, naming the packaging it supersedes. For each build
# the newest packaging of that chain is selected (woodpecker-handoff.mjs resolve); a broken or
# ambiguous chain fails closed. A pin names the build pipeline, never a packaging pipeline.
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

# 1. Discovery: the handoff entries of this source in each role inbox, grouped by build pipeline, newest
# build first. An entry is `<pipeline>-<source>` or a superseding `<pipeline>-<source>@<packaging>`.
declare -A candidates=() entries=()
for role in "${roles[@]}"; do
  printf 'ls -1 "/%s/incoming"\n' "$role" >"$staged/list-$role.batch"
  listing="$(run_batch "$staged/list-$role.batch")"
  names="$(while IFS= read -r entry; do
      entry="${entry%"${entry##*[![:space:]]}"}"; entry="${entry##*/}"
      if [[ "$entry" =~ ^[1-9][0-9]*-${sources[$role]}(@[1-9][0-9]*)?$ ]]; then printf '%s\n' "$entry"; fi
    done <<<"$listing" | LC_ALL=C sort -u)"
  entries[$role]="$names"
  found="$(sed -e 's/-.*//' <<<"$names" | grep -E '^[0-9]+$' | sort -rn -u || true)"
  if [[ -n "${pins[$role]:-}" ]]; then
    grep -Fxq -- "${pins[$role]}" <<<"$found" || {
      echo "no $role handoff from pipeline ${pins[$role]} for source ${sources[$role]}" >&2; exit 1
    }
    found="${pins[$role]}"
  fi
  [[ -n "$found" ]] || { echo "no $role handoff for source ${sources[$role]}" >&2; exit 1; }
  candidates[$role]="$found"
done
build_entries() { grep -E "^$2-${sources[$1]}(@[1-9][0-9]*)?\$" <<<"${entries[$1]}" || true; }

# 2. Completion markers only; an absent marker is an unfinished upload.
: >"$staged/markers.batch"
for role in "${roles[@]}"; do
  mkdir -p "$staged/markers/$role"
  while IFS= read -r run; do
    while IFS= read -r entry; do
      printf -- '-get "/%s/incoming/%s/%s/UPLOAD_COMPLETE" "%s/markers/%s/%s"\n' \
        "$role" "$entry" "$role" "$staged" "$role" "$entry" >>"$staged/markers.batch"
    done < <(build_entries "$role" "$run")
  done <<<"${candidates[$role]}"
done
run_batch "$staged/markers.batch" >/dev/null

# 3. Selection: the newest build with a complete handoff of this release, and within it the newest
# packaging of its supersede chain; identity drift or an ambiguous chain fails closed.
declare -A selected=() selected_entry=() selected_packaging=()
for role in "${roles[@]}"; do
  while IFS= read -r run; do
    mapfile -t build_names < <(build_entries "$role" "$run")
    resolved="$(node "$scripts/woodpecker-handoff.mjs" resolve "$staged/markers/$role" "$role" "${sources[$role]}" "$compiler_sha" "$run" "${build_names[@]}")" || exit 1
    while IFS= read -r entry; do
      [[ -z "$entry" ]] || echo "skipping incomplete $role handoff $entry" >&2
    done < <(jq -r '.incomplete[]' <<<"$resolved")
    if [[ "$(jq -r '.selected == null' <<<"$resolved")" == true ]]; then
      echo "skipping incomplete $role handoff from pipeline $run" >&2; continue
    fi
    marker_version="$(jq -r '.selected.fields.version' <<<"$resolved")"
    if [[ "$marker_version" != "$version" ]]; then
      echo "skipping $role handoff from pipeline $run: it is a $marker_version build" >&2; continue
    fi
    selected[$role]="$run"
    selected_entry[$role]="$(jq -r '.selected.entry' <<<"$resolved")"
    selected_packaging[$role]="$(jq -r '.selected.packaging.pipeline' <<<"$resolved")"
    while IFS= read -r line; do
      [[ -z "$line" ]] || echo "$role build $run: packaging $line is superseded" >&2
    done < <(jq -r '.superseded[] | "\(.pipeline) (\(.entry))"' <<<"$resolved")
    break
  done <<<"${candidates[$role]}"
  [[ -n "${selected[$role]:-}" ]] || {
    echo "no complete $role handoff of $version for source ${sources[$role]}" >&2; exit 1
  }
done

# 4. Fetch the selected handoffs and verify every checksum before they become visible. A superseding
# entry is fetched into the build's own layout `<role>/incoming/<pipeline>-<source>/<role>`.
: >"$staged/fetch.batch"
for role in "${roles[@]}"; do
  mkdir -p "$staged/handoff/$role/incoming/${selected[$role]}-${sources[$role]}"
  printf 'get -R "/%s/incoming/%s/%s" "%s/handoff/%s/incoming/%s-%s/"\n' \
    "$role" "${selected_entry[$role]}" "$role" "$staged" "$role" "${selected[$role]}" "${sources[$role]}" >>"$staged/fetch.batch"
done
run_batch "$staged/fetch.batch" >/dev/null
for role in "${roles[@]}"; do
  incoming="$staged/handoff/$role/incoming/${selected[$role]}-${sources[$role]}/$role"
  test -d "$incoming" || { echo "missing fetched $role handoff" >&2; exit 1; }
  validated="$(node "$scripts/woodpecker-handoff.mjs" validate "$incoming" "$role" "${sources[$role]}" "$compiler_sha" \
    "$version" "${selected[$role]}")"
  [[ "$(jq -r '.packaged_by // .pipeline' <<<"$validated")" == "${selected_packaging[$role]}" ]] || {
    echo "fetched $role handoff ${selected_entry[$role]} changed its packaging after selection" >&2; exit 1
  }
  echo "selected $role handoff from pipeline ${selected[$role]} (${selected_entry[$role]})" >&2
done
mv "$staged/handoff" "$destination"
printf '%s %s %s\n' "${selected[linux]}" "${selected[macos]}" "${selected[windows]}"
