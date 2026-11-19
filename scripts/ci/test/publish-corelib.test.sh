#!/usr/bin/env bash
# Contract for scripts/release/publish-corelib.sh: argument handling, key-file checks,
# bundle checks, and the structure that keeps registry writes behind the checks.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
# shellcheck source=lib/assert.sh
source "${ROOT}/scripts/ci/test/lib/assert.sh"

SCRIPT="${ROOT}/scripts/release/publish-corelib.sh"
RUNNER_FILE="${ROOT}/scripts/release/lib/corelib-publish-runner.mjs"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
unset BESKID_PCKG_API_KEY

run() { set +e; out="$("$@" 2>&1)"; code=$?; set -e; }

good_key="bpk_$(printf 'a%.0s' $(seq 64))"
printf '%s\n' "$good_key" >"$tmp/key"; chmod 600 "$tmp/key"
mkdir "$tmp/bundle"

run bash "$SCRIPT"
assert_eq 2 "$code" "no arguments is a usage error"
assert_contains "$out" "--bundle is required" "the missing bundle is named"

run bash "$SCRIPT" --bundle "$tmp/bundle"
assert_eq 2 "$code" "a real run without a key is a usage error"
assert_contains "$out" "--key is required unless --dry-run" "the missing key is named"

run bash "$SCRIPT" --bundle "$tmp/bundle" --key "$tmp/key" --frobnicate
assert_eq 2 "$code" "an unknown argument is a usage error"
assert_contains "$out" "unknown argument: --frobnicate" "the unknown argument is named"

run bash "$SCRIPT" --bundle "$tmp/bundle" --key
assert_eq 2 "$code" "a flag without its value is a usage error"

run bash "$SCRIPT" --bundle "$tmp/bundle" --key "$tmp/key" --version huge
assert_eq 1 "$code" "a malformed version policy is rejected"
assert_contains "$out" "--version must be patch, minor, major" "the version policy is explained"

chmod 644 "$tmp/key"
run bash "$SCRIPT" --bundle "$tmp/bundle" --key "$tmp/key"
assert_eq 1 "$code" "a world-readable key file is rejected"
assert_contains "$out" "must not be readable by group or others" "the key permission is explained"
chmod 600 "$tmp/key"

printf 'not-a-key\n' >"$tmp/badkey"; chmod 600 "$tmp/badkey"
run bash "$SCRIPT" --bundle "$tmp/bundle" --key "$tmp/badkey"
assert_eq 1 "$code" "a malformed key file is rejected"
assert_contains "$out" "canonical bpk_ publisher key" "the key format is explained"
assert_eq "absent" "$([[ "$out" == *not-a-key* ]] && echo present || echo absent)" "the key text is never echoed"

: >"$tmp/empty"; chmod 600 "$tmp/empty"
run bash "$SCRIPT" --bundle "$tmp/bundle" --key "$tmp/empty"
assert_eq 1 "$code" "an empty key file is rejected"

ln -s "$tmp/key" "$tmp/keylink"
run bash "$SCRIPT" --bundle "$tmp/bundle" --key "$tmp/keylink"
assert_eq 1 "$code" "a symlinked key file is rejected"

run bash "$SCRIPT" --bundle "$tmp/missing" --key "$tmp/key"
assert_eq 1 "$code" "a missing bundle is rejected"
assert_contains "$out" "--bundle must be a real bundle directory" "the bundle problem is explained"

run bash "$SCRIPT" --bundle "$tmp/bundle" --key "$tmp/key"
assert_eq 1 "$code" "a bundle without the CLI and kits is rejected"
assert_contains "$out" "bundle omitted regular" "the missing bundle file is named"

# The mode check works with GNU and BSD stat (shims stand in for the one this host lacks).
shim_run() { # style mode
  local dir="$tmp/stat-$1-$2"; mkdir -p "$dir"
  case "$1" in
    gnu) cat >"$dir/stat" <<SH
#!/usr/bin/env bash
if [[ "\$1" == -c ]]; then echo "$2"; exit 0; fi
# GNU \`stat -f\` is file-system status and reads \`%Lp\` as a file name.
echo "stat: cannot read file system information for '%Lp'" >&2; echo "garbage"; exit 1
SH
    ;;
    bsd) cat >"$dir/stat" <<SH
#!/usr/bin/env bash
if [[ "\$1" == -c ]]; then echo "stat: illegal option -- c" >&2; exit 1; fi
echo "$2"
SH
    ;;
    junk) cat >"$dir/stat" <<SH
#!/usr/bin/env bash
echo "not-a-mode"
SH
    ;;
  esac
  chmod +x "$dir/stat"
  run env PATH="$dir:$PATH" bash "$SCRIPT" --bundle "$tmp/bundle" --key "$tmp/key"
}
shim_run gnu 600
assert_contains "$out" "bundle omitted regular" "GNU stat: a mode-600 key is accepted"
shim_run bsd 600
assert_contains "$out" "bundle omitted regular" "BSD stat: a mode-600 key is accepted"
shim_run gnu 644
assert_contains "$out" "must not be readable by group or others" "GNU stat: a mode-644 key is rejected"
shim_run bsd 640
assert_contains "$out" "must not be readable by group or others" "BSD stat: a mode-640 key is rejected"
shim_run junk 600
assert_contains "$out" "cannot read the mode of key file" "an unreadable mode fails closed instead of failing in arithmetic"

# An exported key in the caller's environment is never used.
BESKID_PCKG_API_KEY="$good_key" run bash "$SCRIPT" --bundle "$tmp/bundle" --dry-run
assert_eq 1 "$code" "a dry run still validates the bundle"

# Structure: checks come before writes, and no pipeline lane holds the key.
RUNNER="$(cat "$RUNNER_FILE")"
check_pos="$(grep -n 'planPublication({' "$RUNNER_FILE" | head -1 | cut -d: -f1)"
pack_pos="$(grep -n 'const packed = packArtifacts' "$RUNNER_FILE" | head -1 | cut -d: -f1)"
write_pos="$(grep -n 'await createPackage(baseUrl, token, meta)' "$RUNNER_FILE" | head -1 | cut -d: -f1)"
assert_eq "yes" "$([[ -n "$check_pos" && "$check_pos" -lt "$pack_pos" && "$pack_pos" -lt "$write_pos" ]] && echo yes || echo no)" \
  "registry checks run before packing, and packing before the first registry write"
assert_contains "${RUNNER}" 'assertUniqueTags(allPackages);' "tags are checked before any registry access"
assert_contains "${RUNNER}" 'hasApiDocs: true,' "API docs are published for every library"
assert_contains "${RUNNER}" 'library artifact is missing .beskid/docs/api.json' "an artifact without API docs fails validation"
assert_contains "${RUNNER}" 'Authorization: `Bearer ${token}`' "publication uses the canonical bearer-key transport"
assert_contains "${RUNNER}" '["package", "publish", meta.registryName, "--artifact", meta.artifact]' \
  "publication delegates upload to the canonical compiler client"
assert_eq "absent" "$([[ -e "${ROOT}/.woodpecker/pckg.yml" ]] && echo present || echo absent)" "the CI pckg-publish lane is removed"
assert_eq "absent" "$([[ -e "${ROOT}/scripts/ci/corelib-publish.sh" ]] && echo present || echo absent)" "the CI publish wrapper is removed"
leaks="$(grep -rlF 'pckg_release_publisher_key' "${ROOT}/.woodpecker" "${ROOT}/ci" 2>/dev/null || true)"
assert_eq "" "$leaks" "no pipeline binds the pckg publisher key"

finish_tests
