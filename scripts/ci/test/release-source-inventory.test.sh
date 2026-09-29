#!/usr/bin/env bash
set -euo pipefail
script="$(cd "$(dirname "$0")/.." && pwd)/release-source-inventory.sh"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
git -C "$tmp" init -q
mkdir -p "$tmp/packages/foundation/src" "$tmp/packages/foundation/obj/beskid/cache"
printf 'module Test;\n' >"$tmp/packages/foundation/src/Untracked.bd"
if bash "$script" "$tmp" corelib >"$tmp/untracked.out" 2>&1; then
  echo 'untracked Corelib source was accepted' >&2; exit 1
fi
grep -Fq 'Untracked.bd' "$tmp/untracked.out"
mv "$tmp/packages/foundation/src/Untracked.bd" "$tmp/packages/foundation/src/Ignored.bd"
printf '*.bd\n*.bws\n' >"$tmp/.gitignore"
if bash "$script" "$tmp" corelib >"$tmp/ignored.out" 2>&1; then
  echo 'ignored Corelib source was accepted' >&2; exit 1
fi
grep -Fq 'Ignored.bd' "$tmp/ignored.out"
rm "$tmp/packages/foundation/src/Ignored.bd"
printf 'workspace\n' >"$tmp/CoreLib.bws"
if bash "$script" "$tmp" corelib >"$tmp/manifest.out" 2>&1; then
  echo 'ignored Corelib manifest was accepted' >&2; exit 1
fi
grep -Fq 'CoreLib.bws' "$tmp/manifest.out"
rm "$tmp/CoreLib.bws"
printf 'generated copy\n' >"$tmp/packages/foundation/obj/beskid/cache/Generated.bd"
bash "$script" "$tmp" corelib
mkdir -p "$tmp/mods/corelib_pest_gen" "$tmp/vendor/ratkit/src" "$tmp/crates/bsol/src"
printf 'module Test;\n' >"$tmp/mods/corelib_pest_gen/Untracked.bd"
if bash "$script" "$tmp" corelib >"$tmp/mods.out" 2>&1; then
  echo 'untracked Corelib module was accepted' >&2; exit 1
fi
rm "$tmp/mods/corelib_pest_gen/Untracked.bd"
printf 'pub fn extra() {}\n' >"$tmp/vendor/ratkit/src/extra.rs"
if bash "$script" "$tmp" compiler >"$tmp/vendor.out" 2>&1; then
  echo 'untracked compiler vendor source was accepted' >&2; exit 1
fi
rm "$tmp/vendor/ratkit/src/extra.rs"
printf 'pub fn extra() {}\n' >"$tmp/crates/bsol/src/extra.rs"
if bash "$script" "$tmp" bsol >"$tmp/bsol.out" 2>&1; then
  echo 'untracked BSOL dependency source was accepted' >&2; exit 1
fi
echo 'release source inventory tests OK'
