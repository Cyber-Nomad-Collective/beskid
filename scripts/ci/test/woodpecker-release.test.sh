#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "$0")/../../.." && pwd)"
script="$root/scripts/ci/woodpecker-release.sh"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
version=0.4.744
source_sha="$(git -C "$root" rev-parse HEAD)"
compiler_sha="$(git -C "$root" rev-parse HEAD:compiler)"
distrib_sha="$(git -C "$root" rev-parse HEAD:beskid_distrib)"
build_run=41

fail() { echo "FAIL: $*" >&2; exit 1; }
sha() { shasum -a 256 "$1" | awk '{print $1}'; }

write_role() {
  local role="$1" target cli lsp installer_dir
  case "$role" in
    linux) target=x86_64-unknown-linux-gnu; cli=beskid-linux-amd64; lsp=beskid_lsp-linux-amd64 ;;
    macos) target=aarch64-apple-darwin; cli=beskid-darwin-arm64; lsp=beskid_lsp-darwin-arm64 ;;
    windows) target=x86_64-pc-windows-msvc; cli=beskid-windows-amd64.exe; lsp=beskid_lsp-windows-amd64.exe ;;
  esac
  installer_dir="$tmp/rootfs/woodpecker-handoff/$role/incoming/${build_run}-${source_sha}/$role"
  mkdir -p "$installer_dir"
  printf '%s-cli\n' "$role" >"$installer_dir/$cli"
  printf '%s-lsp\n' "$role" >"$installer_dir/$lsp"
  printf '%s-bundle\n' "$role" >"$installer_dir/beskid-${version}-${target}.tar.gz"
  jq -n --arg target "$target" --arg cli "$cli" --arg lsp "$lsp" \
    --arg bundle "beskid-${version}-${target}.tar.gz" \
    '{schema_version:1,target:$target,stage:"native-release-build",builds:{cli:{status:"success",asset:$cli},lsp:{status:"success",asset:$lsp},bundle:{status:"success",asset:$bundle}},diagnostics:[]}' \
    >"$installer_dir/platform-result-${target}.json"
  jq -n --arg role "$role" --arg target "$target" --arg version "$version" \
    --arg source "$source_sha" --arg compiler "$compiler_sha" \
    '{schema_version:1,platform:$role,target:$target,version:$version,channel:"stable",source:{superrepo_commit:$source,compiler_commit:$compiler},platform_result_status:"success",published:false}' \
    >"$installer_dir/woodpecker-build-result.json"
  (
    cd "$installer_dir"
    for name in "$cli" "$lsp" "beskid-${version}-${target}.tar.gz" "platform-result-${target}.json" woodpecker-build-result.json; do
      shasum -a 256 "$name"
    done
  ) >"$installer_dir/SHA256SUMS"

  local installers=()
  case "$role" in
    linux) installers=("beskid-${version}-amd64.deb") ;;
    macos) installers=("beskid-${version}-macos-arm64.dmg" beskid.rb) ;;
    windows) installers=("beskid-${version}-windows-amd64.msi" "beskid-${version}-windows-amd64.exe") ;;
  esac
  for name in "${installers[@]}"; do printf '%s-%s\n' "$role" "$name" >"$installer_dir/$name"; done
  local artifacts='[]' name
  for name in "${installers[@]}"; do
    artifacts="$(jq --arg name "$name" --arg digest "$(sha "$installer_dir/$name")" '. + [{name:$name,sha256:$digest}]' <<<"$artifacts")"
  done
  jq -n --arg role "$role" --arg target "$target" --arg version "$version" \
    --arg source "$source_sha" --arg compiler "$compiler_sha" --arg distrib "$distrib_sha" \
    --arg bundle "$(sha "$installer_dir/beskid-${version}-${target}.tar.gz")" --argjson artifacts "$artifacts" \
    '{schema_version:1,platform:$role,target:$target,version:$version,source:{superrepo_commit:$source,compiler_commit:$compiler},distrib_commit:$distrib,bundle_sha256:$bundle,status:"success",published:false,artifacts:$artifacts}' \
    >"$installer_dir/package-result.json"
  (
    cd "$installer_dir"
    find . -maxdepth 1 -type f ! -name 'UPLOAD_*' -exec basename {} \; | LC_ALL=C sort | while IFS= read -r name; do shasum -a 256 "$name"; done
  ) >"$installer_dir/UPLOAD_SHA256SUMS"
  printf 'role=%s\nsource=%s\ncompiler=%s\nversion=%s\npipeline=%s\n' \
    "$role" "$source_sha" "$compiler_sha" "$version" "$build_run" >"$installer_dir/UPLOAD_COMPLETE"
}

for role in linux macos windows; do write_role "$role"; done
mkdir -p "$tmp/bin" "$tmp/remote"
touch "$tmp/gh.log"
cat >"$tmp/bin/gh" <<'GH'
#!/usr/bin/env bash
set -euo pipefail
printf '%s\n' "$*" >>"$GH_LOG"
repo="$GH_REMOTE"
case "$1 $2" in
  'release view')
    tag="$3"; test -d "$repo/$tag" || exit 1
    if [[ "$*" == *'--json assets'* ]]; then find "$repo/$tag" -maxdepth 1 -type f ! -name .target -exec basename {} \; | LC_ALL=C sort; fi
    ;;
  'release create')
    tag="$3"; mkdir "$repo/$tag"; shift 3
    while [[ $# -gt 0 ]]; do
      case "$1" in
        --repo|--target|--title|--notes-file)
          [[ "$1" == --target ]] && printf '%s\n' "$2" >"$repo/$tag/.target"
          shift 2 ;;
        *) cp "$1" "$repo/$tag/$(basename "$1")"; shift ;;
      esac
    done
    ;;
  'release download')
    tag="$3"; shift 3; pattern= destination=
    while [[ $# -gt 0 ]]; do case "$1" in --pattern) pattern="$2"; shift 2;; --dir) destination="$2"; shift 2;; *) shift;; esac; done
    cp "$repo/$tag/$pattern" "$destination/$pattern"
    ;;
  'release upload')
    tag="$3"; shift 3
    while [[ $# -gt 0 ]]; do case "$1" in --repo) shift 2;; --clobber) shift;; *) cp "$1" "$repo/$tag/$(basename "$1")"; shift;; esac; done
    ;;
  'release edit') exit 0 ;;
  'api --method')
    tag="${4##*/}"; shift 4
    while [[ $# -gt 0 ]]; do case "$1" in -f) [[ "$2" == sha=* ]] && printf '%s\n' "${2#sha=}" >"$repo/$tag/.target"; shift 2;; -F) shift 2;; *) shift;; esac; done
    printf '{}\n'
    ;;
  'api repos/'*)
    tag="${2##*/}"; printf '{"object":{"type":"commit","sha":"%s"}}\n' "$(cat "$repo/$tag/.target")"
    ;;
  *) echo "unsupported fake gh call: $*" >&2; exit 2 ;;
esac
GH
chmod +x "$tmp/bin/gh"

# Preparation consumes the real handoff format and must not touch GitHub.
WOODPECKER_RELEASE_TEST_ROOT="$tmp/rootfs" CI_PIPELINE_NUMBER=70 CI_COMMIT_SHA="$source_sha" \
  PATH="$tmp/bin:$PATH" bash "$script" "$build_run" "$version"
output="$tmp/rootfs/woodpecker-output/releases/70-${source_sha}/qualified"
for name in "beskid-${version}-amd64.deb" "beskid-${version}-macos-arm64.dmg" \
  "beskid-${version}-windows-amd64.msi" "beskid-${version}-windows-amd64.exe"; do
  test -f "$output/assets/$name" || fail "prepared release omitted $name"
done
test ! -s "$tmp/gh.log" || fail 'prepare mode reached GitHub'

# A handoff checksum failure is rejected before a transaction is created.
printf 'tampered\n' >>"$tmp/rootfs/woodpecker-handoff/linux/incoming/${build_run}-${source_sha}/linux/beskid-${version}-amd64.deb"
touch "$tmp/rootfs/woodpecker-handoff/linux/incoming/${build_run}-${source_sha}/linux/UPLOAD_COMPLETE"
if WOODPECKER_RELEASE_TEST_ROOT="$tmp/rootfs" CI_PIPELINE_NUMBER=71 CI_COMMIT_SHA="$source_sha" \
  bash "$script" "$build_run" "$version" 2>"$tmp/tamper.err"; then
  fail 'tampered handoff was accepted'
fi
grep -Fq 'handoff checksum mismatch' "$tmp/tamper.err" || fail 'tamper rejection was not diagnosed'
test ! -e "$tmp/rootfs/woodpecker-output/releases/71-${source_sha}" || fail 'invalid handoff created a transaction'
write_role linux

# The uploader checksum is necessary but not sufficient: the package result's
# own installer hash remains authoritative before publication.
linux_input="$tmp/rootfs/woodpecker-handoff/linux/incoming/${build_run}-${source_sha}/linux"
printf 'replaced after packaging\n' >"$linux_input/beskid-${version}-amd64.deb"
(
  cd "$linux_input"
  find . -maxdepth 1 -type f ! -name 'UPLOAD_*' -exec basename {} \; | LC_ALL=C sort | while IFS= read -r name; do shasum -a 256 "$name"; done
) >"$linux_input/UPLOAD_SHA256SUMS"
touch "$linux_input/UPLOAD_COMPLETE"
if WOODPECKER_RELEASE_TEST_ROOT="$tmp/rootfs" CI_PIPELINE_NUMBER=72 CI_COMMIT_SHA="$source_sha" \
  bash "$script" "$build_run" "$version" 2>"$tmp/package-tamper.err"; then
  fail 'installer differing from package-result was accepted'
fi
grep -Fq 'installer checksum mismatch' "$tmp/package-tamper.err" || fail 'package-result mismatch was not diagnosed'
write_role linux

# Publish mode must fail closed before GitHub unless it is a trusted manual main build.
: >"$tmp/gh.log"
if WOODPECKER_RELEASE_TEST_ROOT="$tmp/rootfs" CI=true CI_PIPELINE_NUMBER=72 CI_COMMIT_SHA="$source_sha" \
  CI_PIPELINE_EVENT=pull_request CI_COMMIT_BRANCH=main GH_TOKEN=test BESKID_PUBLISH_RELEASE=1 \
  PATH="$tmp/bin:$PATH" bash "$script" "$build_run" "$version"; then
  fail 'pull request publication was accepted'
fi
test ! -s "$tmp/gh.log" || fail 'untrusted publication reached GitHub'

# The real entrypoint drives the canonical publisher: every immutable stream,
# immutable installers, every rolling stream, then rolling installers.
: >"$tmp/gh.log"
WOODPECKER_RELEASE_TEST_ROOT="$tmp/rootfs" CI=true CI_PIPELINE_NUMBER=73 CI_COMMIT_SHA="$source_sha" \
  CI_PIPELINE_EVENT=manual CI_COMMIT_BRANCH=main GH_TOKEN=test BESKID_PUBLISH_RELEASE=1 \
  GH_LOG="$tmp/gh.log" GH_REMOTE="$tmp/remote" PATH="$tmp/bin:$PATH" \
  bash "$script" "$build_run" "$version"
cli_immutable="$(grep -n '^release create cli-v' "$tmp/gh.log" | cut -d: -f1)"
lsp_immutable="$(grep -n '^release create lsp-v' "$tmp/gh.log" | cut -d: -f1)"
bundle_immutable="$(grep -n "^release create v${version}" "$tmp/gh.log" | cut -d: -f1)"
installer_immutable="$(grep -n '^release upload cli-v' "$tmp/gh.log" | cut -d: -f1)"
rolling="$(grep -n '^release create cli-stable' "$tmp/gh.log" | cut -d: -f1)"
[[ "$cli_immutable" -lt "$lsp_immutable" && "$lsp_immutable" -lt "$bundle_immutable" && \
   "$bundle_immutable" -lt "$installer_immutable" && "$installer_immutable" -lt "$rolling" ]] || \
  fail 'publication order did not preserve immutable-all before rolling'
grep -Fq "release upload cli-stable" "$tmp/gh.log" || fail 'rolling installers were not uploaded'

# An identical retry compares immutable bytes and performs no immutable writes.
: >"$tmp/gh.log"
WOODPECKER_RELEASE_TEST_ROOT="$tmp/rootfs" CI=true CI_PIPELINE_NUMBER=74 CI_COMMIT_SHA="$source_sha" \
  CI_PIPELINE_EVENT=manual CI_COMMIT_BRANCH=main GH_TOKEN=test BESKID_PUBLISH_RELEASE=1 \
  GH_LOG="$tmp/gh.log" GH_REMOTE="$tmp/remote" PATH="$tmp/bin:$PATH" \
  bash "$script" "$build_run" "$version"
if grep -Eq "^release (create|upload|edit) (cli-v|lsp-v|v${version})" "$tmp/gh.log"; then
  fail 'identical immutable retry performed a write'
fi

# A differing remote installer is detected with raw-byte comparison before any
# rolling release mutation.
printf 'different bytes\n' >"$tmp/remote/cli-v${version}/beskid-${version}-amd64.deb"
: >"$tmp/gh.log"
if WOODPECKER_RELEASE_TEST_ROOT="$tmp/rootfs" CI=true CI_PIPELINE_NUMBER=75 CI_COMMIT_SHA="$source_sha" \
  CI_PIPELINE_EVENT=manual CI_COMMIT_BRANCH=main GH_TOKEN=test BESKID_PUBLISH_RELEASE=1 \
  GH_LOG="$tmp/gh.log" GH_REMOTE="$tmp/remote" PATH="$tmp/bin:$PATH" \
  bash "$script" "$build_run" "$version" 2>"$tmp/remote-mismatch.err"; then
  fail 'different immutable installer was accepted'
fi
grep -Fq 'immutable installer differs' "$tmp/remote-mismatch.err" || fail 'immutable mismatch was not diagnosed'
if grep -Eq '^release (create|upload|edit) (cli-stable|lsp-stable|stable)' "$tmp/gh.log"; then
  fail 'immutable mismatch advanced a rolling release'
fi

echo 'woodpecker release tests OK'
