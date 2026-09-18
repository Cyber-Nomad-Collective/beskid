#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "$0")/../../.." && pwd)"; runner="$root/scripts/ci/woodpecker-fetch-handoffs.sh"
tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
grep -Fq 'role: beskid-release' "$root/.woodpecker/release.yml"
grep -Fq 'woodpecker-fetch-handoffs.sh' "$root/.woodpecker/release.yml"
source=0123456789abcdef0123456789abcdef01234567; run=9; capsule="$run-$source"
mkdir -p "$tmp/bin"; : >"$tmp/key"; : >"$tmp/known hosts"
cat >"$tmp/bin/sftp" <<'EOF'
#!/usr/bin/env bash
while [[ "$1" != -b ]]; do shift; done
batch="$2"; printf '%s\n' "$*" >"$SFTP_ARGS"
while IFS= read -r line; do
  [[ "$line" == get* ]] || continue
  remote=${line#get -R \"}; remote=${remote%%\"*}; rest=${line#*\" \"}; destination=${rest%\"}
  role=${remote#/}; role=${role%%/*}; capsule=${remote##*/}
  mkdir -p "$destination/$capsule/$role"; printf complete >"$destination/$capsule/$role/UPLOAD_COMPLETE"
done <"$batch"
EOF
chmod +x "$tmp/bin/sftp"
PATH="$tmp/bin:$PATH" SFTP_ARGS="$tmp/args" BESKID_RELEASE_SSH_KEY="$tmp/key" \
  BESKID_HANDOFF_KNOWN_HOSTS="$tmp/known hosts" "$runner" "$run" "$source" "$tmp/result"
for role in linux macos windows; do test -f "$tmp/result/$role/incoming/$capsule/$role/UPLOAD_COMPLETE"; done
grep -Fq 'UserKnownHostsFile="' "$tmp/args"
if "$runner" 0 "$source" "$tmp/bad"; then exit 1; fi
if PATH="$tmp/bin:$PATH" SFTP_ARGS="$tmp/args" BESKID_RELEASE_SSH_KEY="$tmp/key" \
  BESKID_HANDOFF_KNOWN_HOSTS="$tmp/known hosts" "$runner" "$run" "$source" "$tmp/result"; then
  echo 'fetch accepted an existing destination' >&2; exit 1
fi
echo 'woodpecker fetch handoffs tests: OK'
