#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "$0")/../../.." && pwd)"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
mkdir -p "$tmp/gates" "$tmp/output" "$tmp/corelib-source" "$tmp/foreign-corelib" "$tmp/foreign-runtime"
git -C "$tmp/corelib-source" init -q
printf 'pinned workspace\n' >"$tmp/corelib-source/CoreLib.bws"
git -C "$tmp/corelib-source" add CoreLib.bws
git -C "$tmp/corelib-source" -c user.name='Gate test' -c user.email='gate-test@example.invalid' commit -qm fixture
printf 'not in source commit\n' >"$tmp/corelib-source/Untracked.bd"
printf 'foreign source\n' >"$tmp/foreign-corelib/CoreLib.bws"
printf 'stale runtime\n' >"$tmp/foreign-runtime/abi.json"
cat >"$tmp/gates/compiler-rust-gate.sh" <<'SH'
#!/usr/bin/env bash
printf 'compiler gate actually ran\n'
printf 'compiler|%s|%s|%s|%s\n' "$BESKID_CORELIB_ROOT" "$BESKID_CORELIB_SOURCE" "$BESKID_RUNTIME_PREFIX" "$CARGO_TARGET_DIR" >>"$BESKID_RELEASE_GATE_TEST_LOG"
test -z "${BESKID_CLI_BIN:-}"
test "$BESKID_CORELIB_ROOT" != "$BESKID_RELEASE_GATE_RAW_CORELIB"
test "$(cat "$BESKID_CORELIB_ROOT/.release-gate-ready")" = 'corelib gate completed'
test "${BESKID_RELEASE_MANAGED_CORELIB:-}" = 1
SH
cat >"$tmp/gates/corelib-gate.sh" <<'SH'
#!/usr/bin/env bash
printf 'Corelib matrix actually ran\n'
printf 'corelib|%s|%s|%s|%s\n' "$BESKID_CORELIB_ROOT" "$BESKID_CORELIB_SOURCE" "$BESKID_RUNTIME_PREFIX" "$CARGO_TARGET_DIR" >>"$BESKID_RELEASE_GATE_TEST_LOG"
test "$BESKID_CORELIB_ROOT" != "$BESKID_CORELIB_SOURCE"
test -d "$BESKID_CORELIB_ROOT"
test -z "$(find "$BESKID_CORELIB_ROOT" -mindepth 1 -print -quit)"
test "$(cat "$BESKID_CORELIB_SOURCE/CoreLib.bws")" = 'pinned workspace'
test ! -e "$BESKID_CORELIB_SOURCE/Untracked.bd"
test "${BESKID_RELEASE_MANAGED_CORELIB:-}" = 1
printf 'corelib gate completed\n' >"$BESKID_CORELIB_ROOT/.release-gate-ready"
SH
chmod +x "$tmp/gates/"*.sh

WOODPECKER_RELEASE_GATE_SCRIPT_DIR="$tmp/gates" WOODPECKER_RELEASE_GATE_CORELIB_SOURCE="$tmp/corelib-source" \
  BESKID_CORELIB_ROOT="$tmp/foreign-corelib" BESKID_CORELIB_SOURCE="$tmp/foreign-corelib" \
  BESKID_RUNTIME_PREFIX="$tmp/foreign-runtime" BESKID_CLI_BIN="$tmp/foreign-cli" CARGO_TARGET_DIR="$tmp/foreign-target" \
  BESKID_RELEASE_GATE_RAW_CORELIB="$root/compiler/corelib" \
  BESKID_RELEASE_GATE_TEST_LOG="$tmp/gate-environment.log" \
  bash "$root/scripts/ci/woodpecker-release-gates.sh" 0.4.744 "$tmp/output"
test "$(wc -l <"$tmp/gate-environment.log" | tr -d ' ')" = 2
test "$(cut -d'|' -f1 "$tmp/gate-environment.log" | tr '\n' ' ')" = 'corelib compiler '
if rg -F "$tmp/foreign" "$tmp/gate-environment.log" >/dev/null; then
  echo 'release gates inherited foreign source or runtime paths' >&2; exit 1
fi
awk -F'|' 'NR == 1 && ($2 == $3 || $2 == "") { exit 1 } NR == 2 && ($2 == $3 || $2 == "") { exit 1 }' "$tmp/gate-environment.log"
grep -Fq "|$root/compiler/target" "$tmp/gate-environment.log"
test "$(cat "$tmp/foreign-corelib/CoreLib.bws")" = 'foreign source'
test "$(cat "$tmp/foreign-runtime/abi.json")" = 'stale runtime'
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
if WOODPECKER_RELEASE_GATE_SCRIPT_DIR="$tmp/gates" WOODPECKER_RELEASE_GATE_CORELIB_SOURCE="$tmp/corelib-source" \
  BESKID_RELEASE_GATE_RAW_CORELIB="$root/compiler/corelib" \
  BESKID_RELEASE_GATE_TEST_LOG="$tmp/failed-environment.log" \
  bash "$root/scripts/ci/woodpecker-release-gates.sh" 0.4.744 "$tmp/failed"; then
  echo 'failed Corelib command produced a successful release gate' >&2
  exit 1
fi
jq -e '.status == "failed" and .exit_code == 7' "$tmp/failed/release-gate-corelib.json" >/dev/null
test ! -e "$tmp/failed/release-gate-compiler.json"

if CI_COMMIT_SHA="$(git -C "$root" rev-parse HEAD)" WOODPECKER_RELEASE_GATE_SCRIPT_DIR="$tmp/gates" \
  bash "$root/scripts/ci/woodpecker-release-gates.sh" 0.4.744 "$tmp/forbidden"; then
  echo 'pipeline accepted a test-only gate override' >&2
  exit 1
fi
echo 'woodpecker release gate producer tests OK'
