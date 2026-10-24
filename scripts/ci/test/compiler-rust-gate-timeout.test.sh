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
grep -Fxq -- '--kill-after=60s 10800 cargo test --workspace --exclude beskid_e2e_tests --exclude beskid_tests_release -- --test-threads=1 --skip interop::glue_owned::' "$fixture/default.log"

PATH="$fixture/bin:$PATH" BESKID_TIMEOUT_CAPTURE="$fixture/override.log" BESKID_TEST_TIMEOUT=75 \
  bash "$fixture/scripts/ci/compiler-rust-gate.sh" runtime
grep -Fxq -- '--kill-after=60s 75 cargo test --workspace --exclude beskid_e2e_tests --exclude beskid_tests_release -- --test-threads=1 --skip interop::glue_owned::' "$fixture/override.log"

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

# Clippy is lint, non-blocking for release: findings are counted and logged, the gate passes.
cat >"$fixture/bin/timeout" <<'SH'
#!/usr/bin/env bash
printf '%s\n' "$*" >>"$BESKID_TIMEOUT_CAPTURE"
if [[ "$*" == *"cargo clippy"* ]]; then
  printf 'warning: this expression creates a reference\n  --> crates/beskid_execution/src/a.rs:1:1\n'
  printf 'error[E0599]: no method named `x`\n'
  printf 'warning: unneeded return statement\n'
  printf 'warning: `beskid_execution` (lib) generated 2 warnings\n'
  printf 'error: could not compile `beskid_execution` due to 1 previous error\n'
  exit 101
fi
SH
chmod +x "$fixture/bin/timeout"
lint_output="$(PATH="$fixture/bin:$PATH" BESKID_TIMEOUT_CAPTURE="$fixture/lint-fail.log" \
  bash "$fixture/scripts/ci/compiler-rust-gate.sh" lint)" || { echo 'clippy findings failed the release gate' >&2; exit 1; }
grep -Fq 'clippy findings: 3 (exit 101; report-only, non-blocking for release)' <<<"$lint_output" || {
  echo "clippy findings were not counted: $lint_output" >&2; exit 1; }

echo 'compiler Rust gate timeout contract OK'
