#!/usr/bin/env bash
# Fetch one build's three role-separated handoffs through a read-only SFTP account.
set -euo pipefail

[[ "$#" == 3 ]] || { echo 'usage: woodpecker-fetch-handoffs.sh <build-run> <source-sha> <destination>' >&2; exit 2; }
build_run="$1"; source_sha="$2"; destination="$3"
[[ "$build_run" =~ ^[1-9][0-9]*$ && "$source_sha" =~ ^[a-f0-9]{40}$ ]] || {
  echo 'invalid handoff identity' >&2; exit 2
}
[[ ! -e "$destination" ]] || { echo 'handoff destination must not already exist' >&2; exit 1; }

ssh_key="${BESKID_RELEASE_SSH_KEY:-/etc/woodpecker/handoff/release.sftp}"
known_hosts="${BESKID_HANDOFF_KNOWN_HOSTS:-/etc/woodpecker/handoff/known_hosts}"
host="${BESKID_HANDOFF_HOST:-bdziam.dev}"
user="${BESKID_RELEASE_SFTP_USER:-beskid-release}"
[[ -f "$ssh_key" && -f "$known_hosts" ]] || {
  echo 'host-managed release SFTP credentials are unavailable' >&2; exit 1
}

capsule="${build_run}-${source_sha}"
batch="$(mktemp)"; staged="$(mktemp -d)"; trap 'rm -f "$batch"; rm -rf "$staged"' EXIT
for role in linux macos windows; do
  mkdir -p "$staged/$role/incoming"
  printf 'get -R "/%s/incoming/%s" "%s/%s/incoming/"\n' \
    "$role" "$capsule" "$staged" "$role" >>"$batch"
done
sftp -b "$batch" -i "$ssh_key" -oBatchMode=yes -oStrictHostKeyChecking=yes \
  -o "UserKnownHostsFile=\"$known_hosts\"" "$user@$host"

for role in linux macos windows; do
  test -d "$staged/$role/incoming/$capsule/$role" || {
    echo "missing fetched $role handoff" >&2; exit 1
  }
done
mv "$staged" "$destination"
