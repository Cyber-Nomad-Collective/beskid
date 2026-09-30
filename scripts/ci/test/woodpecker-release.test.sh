#!/usr/bin/env bash
set -euo pipefail

source_root="$(cd "$(dirname "$0")/../../.." && pwd)"
tmp="$(mktemp -d)"
tmp="$(cd "$tmp" && pwd -P)"
trap 'rm -rf "$tmp"' EXIT
root="$tmp/repo"
git init -q -b main "$root"
mkdir -p "$root/scripts"
cp -R "$source_root/scripts/ci" "$root/scripts/"
compiler_sha="$(git -C "$source_root" rev-parse HEAD:compiler)"
distrib_sha="$(git -C "$source_root" rev-parse HEAD:beskid_distrib)"
git -C "$root" add scripts/ci
git -C "$root" update-index --add --cacheinfo "160000,$compiler_sha,compiler"
git -C "$root" update-index --add --cacheinfo "160000,$distrib_sha,beskid_distrib"
git -C "$root" -c user.name='Release test' -c user.email='release-test@example.invalid' commit -qm fixture
script="$root/scripts/ci/woodpecker-release.sh"
version=0.4.744
source_sha="$(git -C "$root" rev-parse HEAD)"
build_run=41

fail() { echo "FAIL: $*" >&2; exit 1; }
sha() { shasum -a 256 "$1" | awk '{print $1}'; }

write_role() {
  local role="$1" target cli lsp installer_dir runtime_sha abi_sha cases='[]' item id test_target log
  case "$role" in
    linux) target=x86_64-unknown-linux-gnu; cli=beskid-linux-amd64; lsp=beskid_lsp-linux-amd64 ;;
    macos) target=aarch64-apple-darwin; cli=beskid-darwin-arm64; lsp=beskid_lsp-darwin-arm64 ;;
    windows) target=x86_64-pc-windows-msvc; cli=beskid-windows-amd64.exe; lsp=beskid_lsp-windows-amd64.exe ;;
  esac
  installer_dir="$tmp/rootfs/woodpecker-handoff/$role/incoming/${build_run}-${source_sha}/$role"
  mkdir -p "$installer_dir"
  runtime_sha="$(printf '%s-runtime-kit' "$role" | shasum -a 256 | awk '{print $1}')"
  abi_sha="$(printf '%s-abi' "$role" | shasum -a 256 | awk '{print $1}')"
  printf '%s-cli\n' "$role" >"$installer_dir/$cli"
  printf '%s-lsp\n' "$role" >"$installer_dir/$lsp"
  printf '%s-bundle\n' "$role" >"$installer_dir/beskid-${version}-${target}.tar.gz"
  jq -n --arg target "$target" --arg cli "$cli" --arg lsp "$lsp" \
    --arg bundle "beskid-${version}-${target}.tar.gz" \
    '{schema_version:1,target:$target,stage:"native-release-build",builds:{cli:{status:"success",asset:$cli},lsp:{status:"success",asset:$lsp},bundle:{status:"success",asset:$bundle}},diagnostics:[]}' \
    >"$installer_dir/platform-result-${target}.json"
  jq -n --arg role "$role" --arg target "$target" --arg version "$version" \
    --arg source "$source_sha" --arg compiler "$compiler_sha" \
    --arg runtime_sha "$runtime_sha" \
    '{schema_version:1,platform:$role,target:$target,version:$version,channel:"stable",source:{superrepo_commit:$source,compiler_commit:$compiler},runtime_kit_sha256:$runtime_sha,platform_result_status:"success",published:false}' \
    >"$installer_dir/woodpecker-build-result.json"
  local feature_cases=(
    foundations.core_bytes:CoreBytesTests foundations.encoding_utf8:CoreEncodingUtf8Tests foundations.time:SystemTimeTests
    foundations.fibers:ConcurrencyFiberHandleTests foundations.channels:ConcurrencyChannelApiTests
    network.types:NetworkTypesTests network.dns:NetworkDnsTests network.tcp:NetworkTcpTests network.udp:NetworkUdpTests
    network.scope:NetworkScopeTests network.shutdown:NetworkShutdownLeakTests network.disposable:NetworkDisposableTests
    http.codec:HttpCodecTests http.validation:HttpValidationTests http.serialization:HttpSerializationTests http.exchange:HttpExchangeTests
  )
  for item in "${feature_cases[@]}"; do
    id="${item%%:*}"; test_target="${item#*:}"; log="feature-${id//./-}.json"
    jq -n --arg target "$test_target" '{target:$target,tests:[{qualified_name:($target+".passes"),outcome:"passed"}]}' >"$installer_dir/$log"
    cases="$(jq --arg id "$id" --arg target "$test_target" --arg log "$log" --arg digest "$(sha "$installer_dir/$log")" \
      '. + [{id:$id,target:$target,status:"success",log:$log,log_sha256:$digest,test_ids:[$target+".passes"]}]' <<<"$cases")"
  done
  jq -n --arg role "$role" --arg target "$target" --arg version "$version" \
    --arg source "$source_sha" --arg compiler "$compiler_sha" --arg runtime "$runtime_sha" --arg abi "$abi_sha" \
    --arg glue_reason 'Glue bindings are outside the v0.5 release contract; generated Rust/.NET bindings remain deferred to v0.6.' \
    --argjson cases "$cases" \
    '{schema_version:1,platform:$role,target:$target,version:$version,source:{superrepo_commit:$source,compiler_commit:$compiler},runtime_kit:{profile:"release",target:$target,sha256:$runtime,abi_sha256:$abi},cases:$cases,not_applicable:{glue:{status:"not_applicable",reason:$glue_reason}}}' \
    >"$installer_dir/feature-evidence-v1.json"
  (
    cd "$installer_dir"
    for name in "$cli" "$lsp" "beskid-${version}-${target}.tar.gz" "platform-result-${target}.json" woodpecker-build-result.json feature-evidence-v1.json; do
      shasum -a 256 "$name"
    done
    for name in feature-*.json; do [[ "$name" == feature-evidence-v1.json ]] || shasum -a 256 "$name"; done
  ) >"$installer_dir/SHA256SUMS"

  local installers=()
  case "$role" in
    linux) installers=("beskid-${version}-amd64.deb") ;;
    macos) installers=("beskid-${version}-macos-arm64.dmg" beskid.rb) ;;
    windows) installers=("beskid-${version}-windows-amd64.msi" "beskid-${version}-windows-amd64.exe") ;;
  esac
  for name in "${installers[@]}"; do
    if [[ "$name" == beskid.rb ]]; then
      printf 'class Beskid\n  url "https://github.com/Cyber-Nomad-Collective/beskid_compiler/releases/download/v%s/beskid-%s-%s.tar.gz"\n  version "%s"\nend\n' \
        "$version" "$version" "$target" "$version" >"$installer_dir/$name"
    else
      printf '%s-%s\n' "$role" "$name" >"$installer_dir/$name"
    fi
  done
  local artifacts='[]' name
  for name in "${installers[@]}"; do
    artifacts="$(jq --arg name "$name" --arg digest "$(sha "$installer_dir/$name")" '. + [{name:$name,sha256:$digest}]' <<<"$artifacts")"
  done
  jq -n --arg role "$role" --arg target "$target" --arg version "$version" \
    --arg source "$source_sha" --arg compiler "$compiler_sha" --arg distrib "$distrib_sha" \
    --arg bundle "$(sha "$installer_dir/beskid-${version}-${target}.tar.gz")" --argjson artifacts "$artifacts" \
    '{schema_version:1,platform:$role,target:$target,version:$version,source:{superrepo_commit:$source,compiler_commit:$compiler},distrib_commit:$distrib,bundle_sha256:$bundle,status:"success",published:false,artifacts:$artifacts}' \
    >"$installer_dir/package-result.json"
  if [[ "$role" == linux ]]; then
    for item in 'compiler rust-gate' 'corelib matrix'; do
      read -r component stage <<<"$item"
      log="release-gate-${component}.log"
      printf 'fixture %s gate executed\n' "$component" >"$installer_dir/$log"
      jq -n --arg component "$component" --arg stage "$stage" \
        --arg version "$version" --arg source "$source_sha" --arg compiler "$compiler_sha" \
        --arg log "$log" --arg digest "$(sha "$installer_dir/$log")" \
        '{schema_version:1,component:$component,stage:$stage,platform:"linux",version:$version,source:{superrepo_commit:$source,compiler_commit:$compiler},status:"success",exit_code:0,command:"fixture gate",raw_log:$log,raw_log_sha256:$digest}' \
        >"$installer_dir/release-gate-${component}.json"
    done
  fi
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
  'api repos/Cyber-Nomad-Collective/beskid_homebrew/contents/Formula/beskid.rb')
    if [[ "$*" == *'--method PUT'* ]]; then printf '{}\n'; else exit 1; fi
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
  jq -e --arg name "$name" '.available_artifacts | index($name) != null' \
    "$output/release-state.json" >/dev/null || fail "release state omitted installer $name"
done
test "$(jq -r '.distribution.homebrew_formula.name' "$output/release-state.json")" = beskid.rb || \
  fail 'release state omitted the Homebrew formula'
test ! -s "$tmp/gh.log" || fail 'prepare mode reached GitHub'

# The handoff itself can be complete while the source-bound compiler report is
# absent. That run must fail before reaching any publication call.
linux_input="$tmp/rootfs/woodpecker-handoff/linux/incoming/${build_run}-${source_sha}/linux"
rm "$linux_input/release-gate-compiler.json"
(
  cd "$linux_input"
  find . -maxdepth 1 -type f ! -name 'UPLOAD_*' -exec basename {} \; | LC_ALL=C sort | while IFS= read -r name; do shasum -a 256 "$name"; done
) >"$linux_input/UPLOAD_SHA256SUMS"
if WOODPECKER_RELEASE_TEST_ROOT="$tmp/rootfs" CI_PIPELINE_NUMBER=701 CI_COMMIT_SHA="$source_sha" \
  GH_LOG="$tmp/gh.log" GH_REMOTE="$tmp/remote" PATH="$tmp/bin:$PATH" \
  bash "$script" "$build_run" "$version" 2>"$tmp/missing-gate.err"; then
  fail 'release preparation accepted a handoff without compiler gate evidence'
fi
grep -Fq 'release-gate-compiler.json' "$tmp/missing-gate.err" || fail 'missing compiler gate was not diagnosed'
test ! -s "$tmp/gh.log" || fail 'missing compiler gate reached GitHub'
write_role linux

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
export BESKID_MANUAL_PUBLISH=1
: >"$tmp/gh.log"
if WOODPECKER_RELEASE_TEST_ROOT="$tmp/rootfs" CI=true CI_PIPELINE_NUMBER=720 CI_COMMIT_SHA="$source_sha" \
  CI_PIPELINE_EVENT=manual CI_COMMIT_BRANCH=main GH_TOKEN=test BESKID_PUBLISH_RELEASE=1 \
  GH_LOG="$tmp/gh.log" GH_REMOTE="$tmp/remote" PATH="$tmp/bin:$PATH" \
  bash "$script" "$build_run" "$version" 2>"$tmp/spoofed-main.err"; then
  fail 'spoofed CI manual/main values authorized publication'
fi
grep -Fq 'clean local main checkout' "$tmp/spoofed-main.err" || fail 'spoofed publication was not rejected by real Git state'
test ! -s "$tmp/gh.log" || fail 'spoofed publication reached GitHub'

printf 'not in the release commit\n' >"$root/untracked-source.bd"
if WOODPECKER_RELEASE_TEST_ROOT="$tmp/rootfs" CI=false CI_PIPELINE_NUMBER=722 CI_COMMIT_SHA="$source_sha" \
  GH_TOKEN=test BESKID_PUBLISH_RELEASE=1 GH_LOG="$tmp/gh.log" GH_REMOTE="$tmp/remote" PATH="$tmp/bin:$PATH" \
  bash "$script" "$build_run" "$version" 2>"$tmp/dirty-main.err"; then
  fail 'dirty local main authorized publication with test root'
fi
grep -Fq 'clean local main checkout' "$tmp/dirty-main.err" || fail 'dirty checkout rejection was not diagnosed'
test ! -s "$tmp/gh.log" || fail 'dirty checkout reached GitHub'
rm "$root/untracked-source.bd"

if WOODPECKER_RELEASE_TEST_ROOT="$tmp/rootfs" CI=true CI_PIPELINE_NUMBER=72 CI_COMMIT_SHA="$source_sha" \
  CI_PIPELINE_EVENT=pull_request CI_COMMIT_BRANCH=main GH_TOKEN=test BESKID_PUBLISH_RELEASE=1 \
  PATH="$tmp/bin:$PATH" bash "$script" "$build_run" "$version"; then
  fail 'pull request publication was accepted'
fi
test ! -s "$tmp/gh.log" || fail 'untrusted publication reached GitHub'

# Trusted publication still requires disposable-VM installer evidence.
: >"$tmp/gh.log"
if WOODPECKER_RELEASE_TEST_ROOT="$tmp/rootfs" CI=false CI_PIPELINE_NUMBER=721 CI_COMMIT_SHA="$source_sha" \
  CI_PIPELINE_EVENT=manual CI_COMMIT_BRANCH=main GH_TOKEN=test BESKID_PUBLISH_RELEASE=1 \
  GH_LOG="$tmp/gh.log" GH_REMOTE="$tmp/remote" PATH="$tmp/bin:$PATH" \
  bash "$script" "$build_run" "$version" 2>"$tmp/missing-smoke.err"; then
  fail 'publication without Windows installer smoke evidence was accepted'
fi
grep -Fq 'BESKID_WINDOWS_INSTALLER_SMOKE_DIR' "$tmp/missing-smoke.err" || fail 'missing installer smoke gate was not diagnosed'
test ! -s "$tmp/gh.log" || fail 'missing installer smoke gate reached GitHub'

# Synthetic evidence passes structural validation but cannot authorize publication.
smoke_dir="$tmp/smoke-evidence"
mkdir "$smoke_dir"
node - "$smoke_dir" "$(sha "$tmp/rootfs/woodpecker-handoff/windows/incoming/${build_run}-${source_sha}/windows/beskid-${version}-windows-amd64.exe")" \
  "$(sha "$tmp/rootfs/woodpecker-handoff/windows/incoming/${build_run}-${source_sha}/windows/beskid-${version}-windows-amd64.msi")" <<'NODE'
const fs=require('node:fs'),path=require('node:path');
const [dir,setup,msi]=process.argv.slice(2);
const cases=['runtime','developer','community','preexisting','offline','hash-failure','cancel','repair-deselect','upgrade','uninstall'];
const vendor=['VcRedistX64','VsBuildTools2022','LlvmX64'].map(id=>({id,version:'1.2.3',sha512:'c'.repeat(128),size:100}));
fs.writeFileSync(path.join(dir,'prerequisites.lock.json'),JSON.stringify({schemaVersion:1,packages:vendor.map(item=>({...item,name:`${item.id}.exe`}))}));
for(const page of ['welcome','options','progress','success','failure','msi-directory']) for(const scale of [100,150])fs.writeFileSync(path.join(dir,`${page}-${scale}.png`),'test screenshot');
for(const scenario of cases){
  const failure=['offline','hash-failure','cancel'].includes(scenario),installed=!failure&&scenario!=='uninstall';
  const log=scenario==='cancel'
    ? 'i338: Acquiring package: VcRedistX64, payload: VcRedistX64.exe, download\nUser cancelled\n'
    : `${scenario} ${scenario==='hash-failure'?'hash mismatch':scenario==='offline'?'download failed':'completed'}\n`;
  fs.writeFileSync(path.join(dir,`${scenario}.log`),log);
  fs.writeFileSync(path.join(dir,`${scenario}.json`),JSON.stringify({schema_version:1,scenario,real_windows_vm:true,passed:true,machine_name:'TEST-VM',recorded_utc:'2026-09-26T12:00:00Z',setup_sha256:setup,msi_sha256:msi,observed_setup_sha256:scenario==='hash-failure'?'b'.repeat(64):setup,setup_log:`${scenario}.log`,setup_exit_code:failure?1:0,beskid_installed:installed,vendor_retained:true,community_unchanged:true,vendor,vc_version:'14.44.35211.0',msvc_version:scenario==='runtime'?'':'14.44.35207',sdk_version:scenario==='runtime'?'':'10.0.26100.0',llvm_version:scenario==='runtime'?'':'22.1.8',lld_link_executed:true,fresh_environment:true,cli:{test:true,build:true,run:true},prior_version:scenario==='upgrade'?'0.4.743':'',installed_version:scenario==='upgrade'?'beskid 0.4.744':'',...(scenario==='cancel'?{cancel_trigger:'burn-window-close',download_package:'VcRedistX64',download_payload:'VcRedistX64.exe'}:{})}));
}
NODE
node "$root/scripts/ci/windows-installer-smoke-gate.mjs" "$smoke_dir" \
  "$(sha "$tmp/rootfs/woodpecker-handoff/windows/incoming/${build_run}-${source_sha}/windows/beskid-${version}-windows-amd64.exe")" \
  "$(sha "$tmp/rootfs/woodpecker-handoff/windows/incoming/${build_run}-${source_sha}/windows/beskid-${version}-windows-amd64.msi")" \
  "$smoke_dir/prerequisites.lock.json" >/dev/null

# Synthetic evidence must never authorize production publication.
: >"$tmp/gh.log"
if WOODPECKER_RELEASE_TEST_ROOT="$tmp/rootfs" CI=false CI_PIPELINE_NUMBER=73 CI_COMMIT_SHA="$source_sha" \
  CI_PIPELINE_EVENT=manual CI_COMMIT_BRANCH=main GH_TOKEN=test BESKID_PUBLISH_RELEASE=1 \
  BESKID_WINDOWS_INSTALLER_SMOKE_DIR="$smoke_dir" \
  GH_LOG="$tmp/gh.log" GH_REMOTE="$tmp/remote" PATH="$tmp/bin:$PATH" \
  bash "$script" "$build_run" "$version" 2>"$tmp/unattested-smoke.err"; then
  fail 'synthetic installer evidence authorized publication'
fi
grep -Fq 'no CI-attested disposable-VM provenance' "$tmp/unattested-smoke.err" || fail 'unattested evidence was not diagnosed'
test ! -s "$tmp/gh.log" || fail 'unattested installer evidence reached GitHub'

# An explicit owner decision is a separate manual-only route. It must name
# this exact source and setup executable, and only then reach publication.
waiver="$tmp/windows-owner-waiver.json"
setup_digest="$(sha "$tmp/rootfs/woodpecker-handoff/windows/incoming/${build_run}-${source_sha}/windows/beskid-${version}-windows-amd64.exe")"
jq -n --arg source "$source_sha" --arg version "$version" --arg setup "$setup_digest" \
  '{schema_version:1,decision:"release-owner-installer-test-waiver",scope:"windows-installer-scenario-tests-only",source_commit:$source,version:$version,installer_sha256:$setup,approved_utc:"2026-09-28T00:00:00Z"}' >"$waiver"
: >"$tmp/gh.log"
if WOODPECKER_RELEASE_TEST_ROOT="$tmp/rootfs" CI=false CI_PIPELINE_NUMBER=74 CI_COMMIT_SHA="$source_sha" \
  CI_PIPELINE_EVENT=manual CI_COMMIT_BRANCH=main GH_TOKEN=test BESKID_PUBLISH_RELEASE=1 \
  BESKID_WINDOWS_INSTALLER_OWNER_WAIVER_FILE="$waiver" \
  GH_LOG="$tmp/gh.log" GH_REMOTE="$tmp/remote" PATH="$tmp/bin:$PATH" \
  bash "$script" "$build_run" "$version" 2>"$tmp/owner-waiver.err"; then
  :
fi
test -s "$tmp/gh.log" || fail 'matching owner waiver did not pass the installer publication gate'
state="$tmp/rootfs/woodpecker-output/releases/74-${source_sha}/qualified/release-state.json"
jq -e --arg source "$source_sha" --arg setup "$setup_digest" \
  '.windows_installer_acceptance.source_commit == $source and .windows_installer_acceptance.installer_sha256 == $setup and .windows_installer_acceptance.scope == "windows-installer-scenario-tests-only"' \
  "$state" >/dev/null || fail 'qualified release state omitted the scoped owner waiver'

# A manual Woodpecker run can supply the same decision record as a pipeline
# variable, without requiring a pre-existing file inside the short-lived job.
: >"$tmp/gh.log"
if WOODPECKER_RELEASE_TEST_ROOT="$tmp/rootfs" CI=false CI_PIPELINE_NUMBER=741 CI_COMMIT_SHA="$source_sha" \
  CI_PIPELINE_EVENT=manual CI_COMMIT_BRANCH=main GH_TOKEN=test BESKID_PUBLISH_RELEASE=1 \
  BESKID_WINDOWS_INSTALLER_OWNER_WAIVER_JSON="$(jq -c . "$waiver")" \
  GH_LOG="$tmp/gh.log" GH_REMOTE="$tmp/remote" PATH="$tmp/bin:$PATH" \
  bash "$script" "$build_run" "$version" 2>"$tmp/inline-waiver.err"; then
  :
fi
test -s "$tmp/gh.log" || fail 'matching inline owner waiver did not pass the installer publication gate'

# A record copied from another source revision cannot authorize GitHub calls.
jq '.source_commit="0000000000000000000000000000000000000000"' "$waiver" >"$tmp/wrong-source-waiver.json"
: >"$tmp/gh.log"
if WOODPECKER_RELEASE_TEST_ROOT="$tmp/rootfs" CI=false CI_PIPELINE_NUMBER=75 CI_COMMIT_SHA="$source_sha" \
  CI_PIPELINE_EVENT=manual CI_COMMIT_BRANCH=main GH_TOKEN=test BESKID_PUBLISH_RELEASE=1 \
  BESKID_WINDOWS_INSTALLER_OWNER_WAIVER_FILE="$tmp/wrong-source-waiver.json" \
  GH_LOG="$tmp/gh.log" GH_REMOTE="$tmp/remote" PATH="$tmp/bin:$PATH" \
  bash "$script" "$build_run" "$version" 2>"$tmp/wrong-source-waiver.err"; then
  fail 'owner waiver for another source was accepted'
fi
test ! -s "$tmp/gh.log" || fail 'wrong-source owner waiver reached GitHub'

jq '.installer_sha256="0000000000000000000000000000000000000000000000000000000000000000"' "$waiver" >"$tmp/wrong-installer-waiver.json"
: >"$tmp/gh.log"
if WOODPECKER_RELEASE_TEST_ROOT="$tmp/rootfs" CI=false CI_PIPELINE_NUMBER=76 CI_COMMIT_SHA="$source_sha" \
  CI_PIPELINE_EVENT=manual CI_COMMIT_BRANCH=main GH_TOKEN=test BESKID_PUBLISH_RELEASE=1 \
  BESKID_WINDOWS_INSTALLER_OWNER_WAIVER_FILE="$tmp/wrong-installer-waiver.json" \
  GH_LOG="$tmp/gh.log" GH_REMOTE="$tmp/remote" PATH="$tmp/bin:$PATH" \
  bash "$script" "$build_run" "$version" 2>"$tmp/wrong-installer-waiver.err"; then
  fail 'owner waiver for another installer was accepted'
fi
test ! -s "$tmp/gh.log" || fail 'wrong-installer owner waiver reached GitHub'

ln -s "$waiver" "$tmp/linked-waiver.json"
: >"$tmp/gh.log"
if WOODPECKER_RELEASE_TEST_ROOT="$tmp/rootfs" CI=false CI_PIPELINE_NUMBER=77 CI_COMMIT_SHA="$source_sha" \
  CI_PIPELINE_EVENT=manual CI_COMMIT_BRANCH=main GH_TOKEN=test BESKID_PUBLISH_RELEASE=1 \
  BESKID_WINDOWS_INSTALLER_OWNER_WAIVER_FILE="$tmp/linked-waiver.json" \
  GH_LOG="$tmp/gh.log" GH_REMOTE="$tmp/remote" PATH="$tmp/bin:$PATH" \
  bash "$script" "$build_run" "$version" 2>"$tmp/linked-waiver.err"; then
  fail 'symlinked owner waiver was accepted'
fi
test ! -s "$tmp/gh.log" || fail 'symlinked owner waiver reached GitHub'

jq '.scope="all-release-gates"' "$waiver" >"$tmp/wide-waiver.json"
: >"$tmp/gh.log"
if WOODPECKER_RELEASE_TEST_ROOT="$tmp/rootfs" CI=false CI_PIPELINE_NUMBER=78 CI_COMMIT_SHA="$source_sha" \
  CI_PIPELINE_EVENT=manual CI_COMMIT_BRANCH=main GH_TOKEN=test BESKID_PUBLISH_RELEASE=1 \
  BESKID_WINDOWS_INSTALLER_OWNER_WAIVER_FILE="$tmp/wide-waiver.json" \
  GH_LOG="$tmp/gh.log" GH_REMOTE="$tmp/remote" PATH="$tmp/bin:$PATH" \
  bash "$script" "$build_run" "$version" 2>"$tmp/wide-waiver.err"; then
  fail 'owner waiver with broader scope was accepted'
fi
test ! -s "$tmp/gh.log" || fail 'broader owner waiver reached GitHub'

: >"$tmp/gh.log"
if WOODPECKER_RELEASE_TEST_ROOT="$tmp/rootfs" CI=true CI_PIPELINE_NUMBER=79 CI_COMMIT_SHA="$source_sha" \
  CI_PIPELINE_EVENT=pull_request CI_COMMIT_BRANCH=main GH_TOKEN=test BESKID_PUBLISH_RELEASE=1 \
  BESKID_WINDOWS_INSTALLER_OWNER_WAIVER_FILE="$waiver" \
  GH_LOG="$tmp/gh.log" GH_REMOTE="$tmp/remote" PATH="$tmp/bin:$PATH" \
  bash "$script" "$build_run" "$version" 2>"$tmp/nonmanual-waiver.err"; then
  fail 'owner waiver authorized a nonmanual publication'
fi
test ! -s "$tmp/gh.log" || fail 'nonmanual owner waiver reached GitHub'

echo 'woodpecker release tests OK'
