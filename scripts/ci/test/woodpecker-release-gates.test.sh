#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "$0")/../../.." && pwd)"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
mkdir -p "$tmp/gates" "$tmp/output"
cat >"$tmp/gates/compiler-rust-gate.sh" <<'SH'
#!/usr/bin/env bash
printf 'compiler gate actually ran\n'
SH
cat >"$tmp/gates/corelib-gate.sh" <<'SH'
#!/usr/bin/env bash
printf 'Corelib matrix actually ran\n'
SH
chmod +x "$tmp/gates/"*.sh

WOODPECKER_RELEASE_GATE_SCRIPT_DIR="$tmp/gates" \
  bash "$root/scripts/ci/woodpecker-release-gates.sh" 0.4.744 "$tmp/output"
for component in compiler corelib; do
  report="$tmp/output/release-gate-$component.json"
  jq -e --arg source "$(git -C "$root" rev-parse HEAD)" \
    --arg compiler "$(git -C "$root" rev-parse HEAD:compiler)" \
    '.schema_version == 1 and .status == "success" and .source.superrepo_commit == $source and .source.compiler_commit == $compiler and .version == "0.4.744"' \
    "$report" >/dev/null
  log="$(jq -r .raw_log "$report")"
  digest="$(jq -r .raw_log_sha256 "$report")"
  test "$(shasum -a 256 "$tmp/output/$log" | awk '{print $1}')" = "$digest"
done
grep -Fq 'actually ran' "$tmp/output/release-gate-compiler.log"
grep -Fq 'actually ran' "$tmp/output/release-gate-corelib.log"

cat >"$tmp/gates/corelib-gate.sh" <<'SH'
#!/usr/bin/env bash
printf 'Corelib gate failed\n'
exit 7
SH
if WOODPECKER_RELEASE_GATE_SCRIPT_DIR="$tmp/gates" \
  bash "$root/scripts/ci/woodpecker-release-gates.sh" 0.4.744 "$tmp/failed"; then
  echo 'failed Corelib command produced a successful release gate' >&2
  exit 1
fi
jq -e '.status == "failed" and .exit_code == 7' "$tmp/failed/release-gate-corelib.json" >/dev/null

if CI_COMMIT_SHA="$(git -C "$root" rev-parse HEAD)" WOODPECKER_RELEASE_GATE_SCRIPT_DIR="$tmp/gates" \
  bash "$root/scripts/ci/woodpecker-release-gates.sh" 0.4.744 "$tmp/forbidden"; then
  echo 'pipeline accepted a test-only gate override' >&2
  exit 1
fi
echo 'woodpecker release gate producer tests OK'
