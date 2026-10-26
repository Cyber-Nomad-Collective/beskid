#!/usr/bin/env bash
# Contract for scripts/dev/preview.sh: argument handling, labelling, side-by-side
# install, wrapper and settings repointing, pruning and the report. A fake builder
# stands in for the compiler build; nothing here touches the real home directory.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
# shellcheck source=lib/assert.sh
source "${ROOT}/scripts/ci/test/lib/assert.sh"

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
run() { set +e; out="$("$@" 2>&1)"; code=$?; set -e; }

# A fake checkout: the script under test, a compiler repository with history, a fake builder.
fake="$tmp/root"
mkdir -p "$fake/scripts/dev" "$fake/compiler"
cp "$ROOT/scripts/dev/preview.sh" "$fake/scripts/dev/"
git -C "$fake/compiler" init -q
git -C "$fake/compiler" -c user.name=t -c user.email=t@t commit -q --allow-empty -m "first change"
cat >"$tmp/builder.sh" <<'SH'
#!/usr/bin/env bash
set -euo pipefail
package="$1" target="$3" asset="$4" label="$5"
[[ "$package" == beskid_bundle && "${BESKID_PREVIEW_BUILD:-}" == 1 ]] || { echo "bad builder call" >&2; exit 1; }
d="$(mktemp -d)/beskid-$label-$target"
mkdir -p "$d/bin"
# Each binary reports the release version the builder stamps (UNSTAMPED_UP: the updater does not).
for binary in beskid beskid_lsp beskid-up; do
  version="$label"; [[ -z "${UNSTAMPED_UP:-}" || "$binary" != beskid-up ]] || version=0.6.6
  printf '#!/bin/sh\necho %s %s\n' "$binary" "$version" >"$d/bin/$binary"
done
chmod 755 "$d/bin/"*
printf '%s\n' "$label" >"$d/release-version.txt"
tar -C "$(dirname "$d")" -czf "$asset" "$(basename "$d")"
SH
export BESKID_PREVIEW_BUILDER="$tmp/builder.sh"
export BESKID_PREVIEW_HOME="$tmp/home"
export BESKID_PREVIEW_TARGET=aarch64-apple-darwin
export BESKID_PREVIEW_SETTINGS="$tmp/home/settings.json"
mkdir -p "$tmp/home/.local/bin" "$tmp/home/.beskid/toolchains/beskid-0.6.6-aarch64-apple-darwin"
P="$fake/scripts/dev/preview.sh"

# Argument handling.
run bash "$P" --frobnicate
assert_eq 2 "$code" "an unknown argument is a usage error"
assert_contains "$out" "unknown argument: --frobnicate" "the unknown argument is named"
run bash "$P" --base-version
assert_eq 2 "$code" "a flag without its value is a usage error"
run bash "$P" --base-version 0.6
assert_eq 1 "$code" "a malformed base version is rejected"
BESKID_PREVIEW_TARGET=x86_64-pc-windows-msvc run bash "$P" --dry-run
assert_eq 1 "$code" "a non-Mac target is rejected"

run bash "$P" --dry-run
assert_eq 0 "$code" "a dry run succeeds"
assert_contains "$out" "preview 0.6.7-preview.1 (dry run, nothing changed)" "the first label is preview.1"
assert_contains "$out" "toolchains/beskid-0.6.7-preview.1-aarch64-apple-darwin" "the toolchain path carries label and target"
assert_eq "no" "$([[ -e "$tmp/home/.local/bin/beskid" ]] && echo yes || echo no)" "a dry run writes no wrapper"

# A settings file with comments, odd spacing and unrelated keys must keep every other byte.
cat >"$BESKID_PREVIEW_SETTINGS" <<'JSON'
{
    // keep this comment
    "workbench.colorTheme": "GitHub Dark",
    "beskid.cli.path":   "/old/beskid",
    "editor.fontSize": 14,
    "beskid.lsp.server.path": "/old/beskid_lsp"
}
JSON
cp "$BESKID_PREVIEW_SETTINGS" "$tmp/settings.before"
git -C "$fake/compiler" -c user.name=t -c user.email=t@t commit -q --allow-empty -m "second change"

run bash "$P" --skip-extension
assert_eq 0 "$code" "the first preview installs"
tc="$tmp/home/.beskid/toolchains/beskid-0.6.7-preview.1-aarch64-apple-darwin"
assert_file_exists "$tc/bin/beskid" "the CLI is installed side by side"
assert_eq "0.6.7-preview.1" "$(< "$tc/release-version.txt")" "the bundle carries the preview label"
assert_eq "yes" "$([[ -d "$tmp/home/.beskid/toolchains/beskid-0.6.6-aarch64-apple-darwin" ]] && echo yes || echo no)" "other toolchains are untouched"
assert_eq "#!/bin/sh
exec \"$tc/bin/beskid\" \"\$@\"" "$(< "$tmp/home/.local/bin/beskid")" "the beskid wrapper execs the preview CLI"
assert_contains "$(< "$tmp/home/.local/bin/beskid_lsp")" "exec \"$tc/bin/beskid_lsp\"" "the language server wrapper execs the preview server"
assert_eq "yes" "$([[ -x "$tmp/home/.local/bin/beskid" ]] && echo yes || echo no)" "the wrapper is executable"
expected="$(sed "s#\"/old/beskid\"#\"$tc/bin/beskid\"#; s#\"/old/beskid_lsp\"#\"$tc/bin/beskid_lsp\"#" "$tmp/settings.before")"
assert_eq "$expected" "$(< "$BESKID_PREVIEW_SETTINGS")" "only the two setting values changed; formatting and comments survive"
assert_eq 1 "$(ls "$tmp/home"/settings.json.bak-* | wc -l | tr -d ' ')" "the settings were backed up first"
assert_eq "$(< "$tmp/settings.before")" "$(< "$tmp/home"/settings.json.bak-*)" "the backup is the original file"
assert_contains "$out" "Preview 0.6.7-preview.1 installed" "the version is reported"
assert_contains "$out" "(no previous preview to compare with)" "the first preview has nothing to compare with"
assert_contains "$out" "Developer: Reload Window" "the reload hint is printed"

git -C "$fake/compiler" -c user.name=t -c user.email=t@t commit -q --allow-empty -m "third change"
sleep 1
run bash "$P" --skip-extension
assert_contains "$out" "Preview 0.6.7-preview.2 installed" "the next preview increments"
assert_contains "$out" "third change" "the commits since the previous preview are listed"
assert_eq "no" "$([[ "$out" == *"second change"* ]] && echo yes || echo no)" "older commits are not listed"

for i in 3 4; do sleep 1; run bash "$P" --skip-extension; done
tcs="$(ls "$tmp/home/.beskid/toolchains" | tr '\n' ' ')"
assert_eq "beskid-0.6.6-aarch64-apple-darwin beskid-0.6.7-preview.2-aarch64-apple-darwin beskid-0.6.7-preview.3-aarch64-apple-darwin beskid-0.6.7-preview.4-aarch64-apple-darwin " "$tcs" "only the last three previews are kept"
assert_contains "$out" "pruned" "the pruned preview is reported"

# A missing settings key is inserted; a missing file is created.
printf '{\n    "editor.fontSize": 14\n}\n' >"$BESKID_PREVIEW_SETTINGS"
sleep 1; run bash "$P" --skip-extension
python3 -c 'import json,sys; d=json.load(open(sys.argv[1])); assert d["editor.fontSize"]==14 and d["beskid.cli.path"].endswith("preview.5-aarch64-apple-darwin/bin/beskid") and "beskid.lsp.server.path" in d' "$BESKID_PREVIEW_SETTINGS"
assert_eq 0 "$?" "missing keys are added without disturbing the file"

# A failed build changes nothing.
before="$(ls "$tmp/home/.beskid/toolchains" | tr '\n' ' ')"
wrapper_before="$(< "$tmp/home/.local/bin/beskid")"
printf '#!/usr/bin/env bash\nexit 1\n' >"$tmp/bad-builder.sh"
BESKID_PREVIEW_BUILDER="$tmp/bad-builder.sh" run bash "$P" --skip-extension
assert_eq 1 "$code" "a failing build fails the run"
assert_eq "$before" "$(ls "$tmp/home/.beskid/toolchains" | tr '\n' ' ')" "a failing build installs nothing"
assert_eq "$wrapper_before" "$(< "$tmp/home/.local/bin/beskid")" "a failing build leaves the wrapper alone"

# A bundle whose binaries do not all report the preview label installs nothing.
before="$(ls "$tmp/home/.beskid/toolchains" | tr '\n' ' ')"
UNSTAMPED_UP=1 run bash "$P" --skip-extension
assert_eq 1 "$code" "an unstamped updater fails the run"
assert_contains "$out" "bin/beskid-up reports 'beskid-up 0.6.6'" "the unstamped binary is named"
assert_eq "$before" "$(ls "$tmp/home/.beskid/toolchains" | tr '\n' ' ')" "an unstamped bundle installs nothing"

# The release builder accepts a preview label only behind the preview switch.
BUILDER="$(cat "$ROOT/scripts/ci/build-release-artifact.sh")"
assert_contains "$BUILDER" 'BESKID_PREVIEW_BUILD:-}" == 1' "the release builder has the preview switch"
assert_contains "$BUILDER" 'preview builds are forbidden in Woodpecker' "pipelines can never preview"
assert_contains "$BUILDER" 'preview\.[1-9][0-9]*$' "the preview label shape is enforced"
assert_contains "$BUILDER" 'export BESKID_RELEASE_VERSION="${RELEASE_VERSION}"' "one version source stamps every binary"

finish_tests
