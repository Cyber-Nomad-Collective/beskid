#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "$0")/../../.." && pwd)"
fixture="$(mktemp -d)"
trap 'rm -rf "$fixture"' EXIT
mkdir -p "$fixture/scripts/ci" "$fixture/compiler" "$fixture/bin"
cp "$root/scripts/ci/compiler-rust-gate.sh" "$fixture/scripts/ci/compiler-rust-gate.sh"

cat >"$fixture/bin/timeout" <<'SH'
#!/usr/bin/env bash
printf '%s\n' "$*" >>"$BESKID_TIMEOUT_CAPTURE"
SH
chmod +x "$fixture/bin/timeout"

PATH="$fixture/bin:$PATH" BESKID_TIMEOUT_CAPTURE="$fixture/default.log" \
  bash "$fixture/scripts/ci/compiler-rust-gate.sh" runtime
grep -Fxq -- '--kill-after=60s 600 bash scripts/stage-native-runtime-kit.sh' "$fixture/default.log"
grep -Fxq -- '--kill-after=60s 10800 cargo test --workspace --exclude beskid_e2e_tests -- --test-threads=1' "$fixture/default.log"

PATH="$fixture/bin:$PATH" BESKID_TIMEOUT_CAPTURE="$fixture/override.log" BESKID_TEST_TIMEOUT=75 \
  bash "$fixture/scripts/ci/compiler-rust-gate.sh" runtime
grep -Fxq -- '--kill-after=60s 75 cargo test --workspace --exclude beskid_e2e_tests -- --test-threads=1' "$fixture/override.log"

# The lint phase is clippy alone: no source-text search for retired identifiers (the #325 false
# positive matched TypeContext inside ExpectedTypeContext).
if grep -Eq 'legacy_patterns|legacy type-system' "$root/scripts/ci/compiler-rust-gate.sh"; then
  echo 'compiler Rust gate still searches sources for legacy type-system names' >&2; exit 1
fi
mkdir -p "$fixture/compiler/crates/demo/src"
printf 'struct ExpectedTypeContext;\nstruct TypeContext;\nfn expr_types() {}\n' >"$fixture/compiler/crates/demo/src/lib.rs"
cat >"$fixture/bin/rustup" <<'SH'
#!/usr/bin/env bash
exit 0
SH
chmod +x "$fixture/bin/rustup"
PATH="$fixture/bin:$PATH" BESKID_TIMEOUT_CAPTURE="$fixture/lint.log" \
  bash "$fixture/scripts/ci/compiler-rust-gate.sh" lint
grep -Fxq -- '--kill-after=60s 600 cargo clippy --workspace --all-targets --no-deps -- -D warnings' "$fixture/lint.log"

echo 'compiler Rust gate timeout contract OK'
