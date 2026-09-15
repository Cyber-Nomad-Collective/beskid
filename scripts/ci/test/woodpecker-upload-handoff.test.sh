#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "$0")/../../.." && pwd)"; runner="$root/scripts/ci/woodpecker-upload-handoff.sh"; tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
source="$(git -C "$root" rev-parse HEAD)"; compiler="$(git -C "$root" rev-parse HEAD:compiler)"; mkdir -p "$tmp/out" "$tmp/bin"; printf binary >"$tmp/out/beskid-linux-amd64"; printf installer >"$tmp/out/beskid-setup.sh"; : >"$tmp/ssh"; : >"$tmp/known"
cat >"$tmp/bin/sftp" <<'EOF'
#!/usr/bin/env bash
while [[ "$1" != -b ]]; do shift; done
cat "$2" >"$SFTP_LOG"; printf '%s\n' "$*" >"$SFTP_ARGS"; mkdir -p "$SFTP_CAPTURE"
while IFS= read -r line; do
  [[ "$line" == put* ]] || continue
  source=${line#put \"}; source=${source%%\"*}; cp "$source" "$SFTP_CAPTURE/$(basename "$source")"
done <"$2"
EOF
chmod +x "$tmp/bin/sftp"
run() { PATH="$tmp/bin:$PATH" SFTP_LOG="$tmp/batch" SFTP_ARGS="$tmp/args" SFTP_CAPTURE="$tmp/capture" BESKID_HANDOFF_SSH_KEY="$tmp/ssh" BESKID_HANDOFF_KNOWN_HOSTS="$tmp/known" CI_PIPELINE_EVENT=manual CI_PIPELINE_NUMBER=9 CI_COMMIT_SHA="$source" "$runner" linux "$tmp/out" "$source" "$compiler" 0.4.0 9; }
if "$runner" linux "$tmp/out" "$source" "$compiler" 0.4.0 9; then exit 1; fi
run
grep -Fq 'UPLOAD_SHA256SUMS' "$tmp/batch"; tail -1 "$tmp/batch" | grep -Fq UPLOAD_COMPLETE; grep -Fq 'beskid-linux@bdziam.dev' "$tmp/args"; if grep -Fq HANDOFF_SIGNING "$root/scripts/ci/woodpecker-upload-handoff.sh"; then exit 1; fi
expected="$(printf binary | sha256sum | awk '{print $1}')"; grep -Fq "$expected" <(sha256sum "$tmp/out/beskid-linux-amd64")
if grep -Fq UPLOAD_SHA256SUMS "$tmp/capture/UPLOAD_SHA256SUMS"; then exit 1; fi; (cd "$tmp/capture" && sha256sum -c UPLOAD_SHA256SUMS); grep -Eq '^[a-f0-9]{64}  [^/]+$' "$tmp/capture/UPLOAD_SHA256SUMS"
touch "$tmp/out/unsafe name"
if run; then echo 'unsafe SFTP artifact name unexpectedly accepted' >&2; exit 1; fi
rm "$tmp/out/unsafe name"
ln -s /etc/passwd "$tmp/out/evil"; if run; then exit 1; fi
echo 'woodpecker upload handoff tests: OK'
