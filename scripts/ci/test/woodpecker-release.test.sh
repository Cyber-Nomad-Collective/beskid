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
bsol_sha="$(git -C "$source_root" rev-parse HEAD:beskid_bsol)"
git -C "$root" add scripts/ci
git -C "$root" update-index --add --cacheinfo "160000,$compiler_sha,compiler"
git -C "$root" update-index --add --cacheinfo "160000,$distrib_sha,beskid_distrib"
git -C "$root" update-index --add --cacheinfo "160000,$bsol_sha,beskid_bsol"
git -C "$root" -c user.name='Release test' -c user.email='release-test@example.invalid' commit -qm fixture
script="$root/scripts/ci/woodpecker-release.sh"
version=0.4.744
source_sha="$(git -C "$root" rev-parse HEAD)"
# Each platform is built by its own pipeline, so the three handoffs carry different pipeline numbers.
linux_build=41; macos_build=43; windows_build=47
builds=("$linux_build" "$macos_build" "$windows_build")
build_of() { case "$1" in linux) echo "$linux_build" ;; macos) echo "$macos_build" ;; windows) echo "$windows_build" ;; esac; }

fail() { echo "FAIL: $*" >&2; exit 1; }
sha() { shasum -a 256 "$1" | awk '{print $1}'; }

write_role() {
  local role="$1" target cli lsp installer_dir runtime_sha abi_sha cases='[]' item id test_target log
  case "$role" in
    linux) target=x86_64-unknown-linux-gnu; cli=beskid-linux-amd64; lsp=beskid_lsp-linux-amd64 ;;
    macos) target=aarch64-apple-darwin; cli=beskid-darwin-arm64; lsp=beskid_lsp-darwin-arm64 ;;
    windows) target=x86_64-pc-windows-msvc; cli=beskid-windows-amd64.exe; lsp=beskid_lsp-windows-amd64.exe ;;
  esac
  local build_run; build_run="$(build_of "$role")"
  installer_dir="$tmp/rootfs/woodpecker-handoff/$role/incoming/${build_run}-${source_sha}/$role"
  mkdir -p "$installer_dir"
  if [[ "$role" == linux ]]; then
    rm -f "$installer_dir/cli-surface-evidence-v1.json" "$installer_dir/cli-surface-receipt-v1.json"
  fi
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
    '{schema_version:1,platform:$role,target:$target,version:$version,channel:"stable",source:{superrepo_commit:$source,compiler_commit:$compiler},runtime_kit_sha256:$runtime_sha,platform_result_status:"success",published:false} | if $role == "linux" then .corelib_fingerprint = ("d" * 64) else . end' \
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
    jq -n --arg target "$test_target" '{target:$target,summary:{passed:1,failed:0,skipped:0,filtered_out:0,timed_out:0},tests:[{qualified_name:($target+".passes"),outcome:"passed"}]}' >"$installer_dir/$log"
    cases="$(jq --arg id "$id" --arg target "$test_target" --arg log "$log" --arg digest "$(sha "$installer_dir/$log")" \
      '. + [{id:$id,target:$target,status:"success",log:$log,log_sha256:$digest,test_ids:[$target+".passes"]}]' <<<"$cases")"
  done
  jq -n --arg role "$role" --arg target "$target" --arg version "$version" \
    --arg source "$source_sha" --arg compiler "$compiler_sha" --arg runtime "$runtime_sha" --arg abi "$abi_sha" \
    --arg glue_reason 'Glue bindings are outside the v0.5 release contract; generated Rust/.NET bindings remain deferred to v0.6.' \
    --argjson cases "$cases" \
    '{schema_version:1,platform:$role,target:$target,version:$version,source:{superrepo_commit:$source,compiler_commit:$compiler},runtime_kit:{profile:"release",target:$target,sha256:$runtime,abi_sha256:$abi},cases:$cases,not_applicable:{glue:{status:"not_applicable",reason:$glue_reason}}}' \
    >"$installer_dir/feature-evidence-v1.json"
  if [[ "$role" == linux ]]; then
    node "$root/scripts/ci/test/cli-surface-fixture.mjs" \
      "$installer_dir/$cli" "$(sha "$installer_dir/$cli")" "$(printf '%064d' 0 | tr '0' 'd')" \
      >"$installer_dir/cli-surface-evidence-v1.json"
    node "$root/scripts/ci/woodpecker-cli-surface-evidence.mjs" create \
      "$installer_dir/cli-surface-evidence-v1.json" "$installer_dir/$cli" \
      "$installer_dir/cli-surface-receipt-v1.json" "$version" "$source_sha" "$compiler_sha" \
      "$runtime_sha" "$(printf '%064d' 0 | tr '0' 'd')"
  fi
  (
    cd "$installer_dir"
    for name in "$cli" "$lsp" "beskid-${version}-${target}.tar.gz" "platform-result-${target}.json" woodpecker-build-result.json feature-evidence-v1.json; do
      shasum -a 256 "$name"
    done
    for name in feature-*.json; do [[ "$name" == feature-evidence-v1.json ]] || shasum -a 256 "$name"; done
    if [[ "$role" == linux ]]; then shasum -a 256 cli-surface-evidence-v1.json cli-surface-receipt-v1.json; fi
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
  PATH="$tmp/bin:$PATH" bash "$script" "$version" "${builds[@]}"
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
# validated-evidence.json records the build of every platform: its own pipeline and checksum list.
jq -e --argjson linux "$linux_build" --argjson macos "$macos_build" --argjson windows "$windows_build" \
  '.handoffs.linux.pipeline == $linux and .handoffs.macos.pipeline == $macos and .handoffs.windows.pipeline == $windows' \
  "$output/validated-evidence.json" >/dev/null || fail 'validated evidence omitted the per-platform build pipelines'
test "$(jq -r '.handoffs.macos.upload_sha256sums_sha256' "$output/validated-evidence.json")" = \
  "$(sha "$tmp/rootfs/woodpecker-handoff/macos/incoming/${macos_build}-${source_sha}/macos/UPLOAD_SHA256SUMS")" || \
  fail 'validated evidence does not bind the macOS checksum list'
# CLI06-06 is published, not blocking: without a committed record the state says so plainly.
jq -e '.user_observation.status == "not-performed" and .user_observation.blocking == false and
  .user_observation.summary == "CLI06-06 observation: not performed"' "$output/release-state.json" >/dev/null || \
  fail 'release state does not report the missing CLI06-06 observation'

# Candidate rule: the release runs on HEAD and publishes candidate C's builds. Root-only commits after
# C (CI scripts, docs) are allowed; a changed compiler or beskid_distrib pointer or release-case
# manifest is refused before any transaction.
commit_fixture() { git -C "$root" -c user.name='Release test' -c user.email='release-test@example.invalid' commit -qm "$1"; }
printf '# release note\n' >"$root/RELEASE-NOTES.md"
printf '\n# root-only CI fix after the candidate\n' >>"$root/scripts/ci/render-ci-failure.sh"
git -C "$root" add RELEASE-NOTES.md scripts/ci/render-ci-failure.sh
commit_fixture 'root-only change after the candidate'
root_only_sha="$(git -C "$root" rev-parse HEAD)"
WOODPECKER_RELEASE_TEST_ROOT="$tmp/rootfs" CI_PIPELINE_NUMBER=83 CI_COMMIT_SHA="$root_only_sha" \
  BESKID_RELEASE_CANDIDATE="$source_sha" PATH="$tmp/bin:$PATH" bash "$script" "$version" "${builds[@]}" >/dev/null || \
  fail 'a root-only commit after the candidate forced a rebuild'
jq -e --arg source "$source_sha" '.provenance.superrepo_commit == $source' \
  "$tmp/rootfs/woodpecker-output/releases/83-${source_sha}/qualified/release-state.json" >/dev/null || \
  fail 'the release state does not carry the candidate as source identity'
if WOODPECKER_RELEASE_TEST_ROOT="$tmp/rootfs" CI_PIPELINE_NUMBER=84 CI_COMMIT_SHA="$root_only_sha" \
  PATH="$tmp/bin:$PATH" bash "$script" "$version" "${builds[@]}" 2>"$tmp/head-candidate.err"; then
  fail 'without a candidate input the release did not default to HEAD'
fi
grep -Fq "incoming/${linux_build}-${root_only_sha}/linux" "$tmp/head-candidate.err" || \
  fail 'the default candidate is not HEAD'
# Mixed per-platform sources (C/C/D): Linux rebuilt on D, which differs from C only in non-build
# root paths (gate scripts, OpenSpec); macOS and Windows stay on C. The release names C as source
# identity and records each platform's source and the shared build identity.
git -C "$root" reset -q --hard "$source_sha"
mkdir -p "$root/openspec/changes/fixture"
printf 'gate calibration\n' >"$root/openspec/changes/fixture/design.md"
printf '\n# clippy report-only\n' >>"$root/scripts/ci/compiler-rust-gate.sh"
git -C "$root" add openspec scripts/ci/compiler-rust-gate.sh
commit_fixture 'gate changes on D'
d_sha="$(git -C "$root" rev-parse HEAD)"
saved_source="$source_sha"; source_sha="$d_sha"; linux_build=51; write_role linux; source_sha="$saved_source"; linux_build=41
WOODPECKER_RELEASE_TEST_ROOT="$tmp/rootfs" CI_PIPELINE_NUMBER=87 CI_COMMIT_SHA="$d_sha" \
  BESKID_RELEASE_CANDIDATE="$source_sha" BESKID_LINUX_SOURCE="$d_sha" PATH="$tmp/bin:$PATH" \
  bash "$script" "$version" 51 "$macos_build" "$windows_build" >/dev/null 2>"$tmp/mixed.err" || {
  cat "$tmp/mixed.err" >&2; fail 'C/C/D handoffs with only non-build root changes were refused'; }
mixed_state="$tmp/rootfs/woodpecker-output/releases/87-${source_sha}/qualified/release-state.json"
jq -e --arg c "$source_sha" --arg d "$d_sha" --arg compiler "$compiler_sha" --arg bsol "$bsol_sha" --arg distrib "$distrib_sha" '
  .provenance.superrepo_commit == $c and .platform_sources == {linux:$d,macos:$c,windows:$c} and
  .build_identity == {compiler_commit:$compiler,beskid_bsol_commit:$bsol,release_case_manifest_sha256:.build_identity.release_case_manifest_sha256} and
  (.build_identity.release_case_manifest_sha256 | test("^[0-9a-f]{64}$")) and
  .distribution.commit == $distrib and .distribution.commits == {linux:$distrib,macos:$distrib,windows:$distrib}
' "$mixed_state" >/dev/null || fail 'release state does not record the platform sources and build identity'
printf '\n# packaging change\n' >>"$root/scripts/ci/build-release-artifact.sh"
git -C "$root" add scripts/ci/build-release-artifact.sh
commit_fixture 'build script change on E'
e_sha="$(git -C "$root" rev-parse HEAD)"
if WOODPECKER_RELEASE_TEST_ROOT="$tmp/rootfs" CI_PIPELINE_NUMBER=88 CI_COMMIT_SHA="$e_sha" \
  BESKID_RELEASE_CANDIDATE="$source_sha" BESKID_LINUX_SOURCE="$e_sha" PATH="$tmp/bin:$PATH" \
  bash "$script" "$version" 51 "$macos_build" "$windows_build" 2>"$tmp/build-script.err"; then
  fail 'a Linux source with a changed build script was accepted'
fi
grep -Fq 'changes build inputs relative to candidate' "$tmp/build-script.err" || fail 'build script drift was not diagnosed'
grep -Fq 'scripts/ci/build-release-artifact.sh' "$tmp/build-script.err" || fail 'build script drift does not name the file'

for drift in compiler beskid_bsol manifest; do
  git -C "$root" reset -q --hard "$root_only_sha"
  case "$drift" in
    manifest) printf '\n' >>"$root/scripts/ci/release-cases-v06.json"; git -C "$root" add scripts/ci/release-cases-v06.json ;;
    *) git -C "$root" update-index --cacheinfo "160000,$(printf '%040d' 7),$drift" ;;
  esac
  commit_fixture "$drift drift"
  drift_sha="$(git -C "$root" rev-parse HEAD)"
  if WOODPECKER_RELEASE_TEST_ROOT="$tmp/rootfs" CI_PIPELINE_NUMBER=85 CI_COMMIT_SHA="$drift_sha" \
    BESKID_RELEASE_CANDIDATE="$source_sha" PATH="$tmp/bin:$PATH" bash "$script" "$version" "${builds[@]}" 2>"$tmp/drift.err"; then
    fail "the release accepted a $drift change after the candidate"
  fi
  case "$drift" in
    manifest) grep -Fq 'release-case manifest digest of the release commit differs' "$tmp/drift.err" ;;
    *) grep -Fq "the $drift pointer of the release commit differs" "$tmp/drift.err" ;;
  esac || fail "$drift drift was not diagnosed"
  test ! -e "$tmp/rootfs/woodpecker-output/releases/85-${source_sha}" || fail "$drift drift created a transaction"
done
git -C "$root" reset -q --hard "$source_sha"

# Repackaging. Linux and Windows handoffs of C are repackaged by pipelines 91 and 92 from P, a
# descendant of C that changes only packaging inputs (a packaging script and beskid_distrib). Their
# UPLOAD_COMPLETE keeps the build identity (source C, build pipeline) and adds packaged_by and
# packaged_by_commit; their package-result names the same packaging root and P's distrib commit.
handoff_of() { echo "$tmp/rootfs/woodpecker-handoff/$1/incoming/$(build_of "$1")-${source_sha}/$1"; }
cp -R "$tmp/rootfs/woodpecker-handoff" "$tmp/handoff-before-repackage"
new_distrib="$(printf '%040d' 9)"
printf '\n// prune build caches\n' >>"$root/scripts/ci/woodpecker-package-platform.mjs"
git -C "$root" add scripts/ci/woodpecker-package-platform.mjs
git -C "$root" update-index --cacheinfo "160000,$new_distrib,beskid_distrib"
commit_fixture 'repackaging root P'
p_sha="$(git -C "$root" rev-parse HEAD)"
repackage_role() {
  local role="$1" by="$2" packaging="$3" distrib="$4" marker="${5:-yes}" supersedes="${6:-}" result_supersedes="${7-${6:-}}" dir; dir="$(handoff_of "$role")"
  jq --argjson by "$by" --arg packaging "$packaging" --arg distrib "$distrib" --argjson build "$(build_of "$role")" --arg supersedes "$result_supersedes" \
    '.distrib_commit = $distrib | .packaged_by = ({pipeline:$by,superrepo_commit:$packaging,build_pipeline:$build} + (if $supersedes == "" then {} else {supersedes:($supersedes|tonumber)} end))' \
    "$dir/package-result.json" >"$dir/package-result.json.new"
  mv "$dir/package-result.json.new" "$dir/package-result.json"
  (cd "$dir" && find . -maxdepth 1 -type f ! -name 'UPLOAD_*' -exec basename {} \; | LC_ALL=C sort | while IFS= read -r name; do shasum -a 256 "$name"; done) >"$dir/UPLOAD_SHA256SUMS"
  printf 'role=%s\nsource=%s\ncompiler=%s\nversion=%s\npipeline=%s\n' "$role" "$source_sha" "$compiler_sha" "$version" "$(build_of "$role")" >"$dir/UPLOAD_COMPLETE"
  [[ "$marker" == no ]] || printf 'packaged_by=%s\npackaged_by_commit=%s\n' "$by" "$packaging" >>"$dir/UPLOAD_COMPLETE"
  [[ "$marker" == no || -z "$supersedes" ]] || printf 'supersedes=%s\nsupersedes_commit=%s\n' "$supersedes" "$packaging" >>"$dir/UPLOAD_COMPLETE"
}
repackage_role linux 91 "$p_sha" "$new_distrib"
repackage_role windows 92 "$p_sha" "$new_distrib"
WOODPECKER_RELEASE_TEST_ROOT="$tmp/rootfs" CI_PIPELINE_NUMBER=93 CI_COMMIT_SHA="$p_sha" \
  BESKID_RELEASE_CANDIDATE="$source_sha" PATH="$tmp/bin:$PATH" bash "$script" "$version" "${builds[@]}" >/dev/null 2>"$tmp/repackage.err" || {
  cat "$tmp/repackage.err" >&2; fail 'repackaged Linux and Windows handoffs of C were refused'; }
repackaged_state="$tmp/rootfs/woodpecker-output/releases/93-${source_sha}/qualified/release-state.json"
jq -e --arg c "$source_sha" --arg p "$p_sha" --arg old "$distrib_sha" --arg new "$new_distrib" '
  .provenance.superrepo_commit == $c and .platform_sources == {linux:$c,macos:$c,windows:$c} and
  .distribution.commit == null and .distribution.commits == {linux:$new,macos:$old,windows:$new} and
  ([.distribution.packages[] | select(.platform == "linux")][0].packaged_by == {pipeline:91,superrepo_commit:$p,build_pipeline:41}) and
  ([.distribution.packages[] | select(.platform == "macos")][0] | has("packaged_by") | not)
' "$repackaged_state" >/dev/null || fail 'release state does not record the repackaging provenance'
jq -e '.handoffs.linux.packaged_by == 91 and .handoffs.windows.packaged_by == 92 and (.handoffs.macos | has("packaged_by") | not)' \
  "$tmp/rootfs/woodpecker-output/releases/93-${source_sha}/qualified/validated-evidence.json" >/dev/null || \
  fail 'validated evidence does not record the repackaging pipelines'
# A superseding repackage: pipeline 97 superseded the Windows packaging 92. Both the marker and the
# package-result name the superseded packaging, and the evidence records both packagings.
repackage_role windows 97 "$p_sha" "$new_distrib" yes 92
WOODPECKER_RELEASE_TEST_ROOT="$tmp/rootfs" CI_PIPELINE_NUMBER=98 CI_COMMIT_SHA="$p_sha" \
  BESKID_RELEASE_CANDIDATE="$source_sha" PATH="$tmp/bin:$PATH" bash "$script" "$version" "${builds[@]}" >/dev/null 2>"$tmp/supersede.err" || {
  cat "$tmp/supersede.err" >&2; fail 'a superseding Windows repackage was refused'; }
jq -e --arg p "$p_sha" '.handoffs.windows.packaged_by == 97 and .handoffs.windows.packaged_by_commit == $p and .handoffs.windows.supersedes == 92 and .handoffs.windows.supersedes_commit == $p and (.handoffs.linux | has("supersedes") | not)' \
  "$tmp/rootfs/woodpecker-output/releases/98-${source_sha}/qualified/validated-evidence.json" >/dev/null || \
  fail 'validated evidence does not record the superseded and the superseding packaging'
jq -e --arg p "$p_sha" '[.distribution.packages[] | select(.platform == "windows")] | length == 2 and all(.packaged_by == {pipeline:97,superrepo_commit:$p,build_pipeline:47,supersedes:92})' \
  "$tmp/rootfs/woodpecker-output/releases/98-${source_sha}/qualified/release-state.json" >/dev/null || \
  fail 'release state does not record the superseded packaging'
repackage_role windows 97 "$p_sha" "$new_distrib" yes 92 ""
if WOODPECKER_RELEASE_TEST_ROOT="$tmp/rootfs" CI_PIPELINE_NUMBER=99 CI_COMMIT_SHA="$p_sha" \
  BESKID_RELEASE_CANDIDATE="$source_sha" PATH="$tmp/bin:$PATH" bash "$script" "$version" "${builds[@]}" 2>"$tmp/supersede-drift.err"; then
  fail 'a superseding marker without the package-result record was accepted'
fi
grep -Fq 'windows package-result packaging identity differs from its UPLOAD_COMPLETE' "$tmp/supersede-drift.err" || fail 'supersede drift was not diagnosed'
repackage_role windows 92 "$p_sha" "$new_distrib"
# The completion marker must name the same packaging root as the package-result.
repackage_role linux 91 "$p_sha" "$new_distrib" no
if WOODPECKER_RELEASE_TEST_ROOT="$tmp/rootfs" CI_PIPELINE_NUMBER=94 CI_COMMIT_SHA="$p_sha" \
  BESKID_RELEASE_CANDIDATE="$source_sha" PATH="$tmp/bin:$PATH" bash "$script" "$version" "${builds[@]}" 2>"$tmp/repackage-marker.err"; then
  fail 'a package-result repackaging identity without its UPLOAD_COMPLETE record was accepted'
fi
grep -Fq 'linux package-result packaging identity differs from its UPLOAD_COMPLETE' "$tmp/repackage-marker.err" || fail 'marker/package-result repackaging drift was not diagnosed'
# A packaging root that changes a build input cannot repackage C.
printf '\n# build change\n' >>"$root/scripts/ci/build-release-artifact.sh"
git -C "$root" add scripts/ci/build-release-artifact.sh
commit_fixture 'not a packaging-only root'
q_sha="$(git -C "$root" rev-parse HEAD)"
repackage_role linux 91 "$q_sha" "$new_distrib"
if WOODPECKER_RELEASE_TEST_ROOT="$tmp/rootfs" CI_PIPELINE_NUMBER=95 CI_COMMIT_SHA="$q_sha" \
  BESKID_RELEASE_CANDIDATE="$source_sha" PATH="$tmp/bin:$PATH" bash "$script" "$version" "${builds[@]}" 2>"$tmp/repackage-build.err"; then
  fail 'a repackaging root with a changed build script was accepted'
fi
grep -Fq 'changes inputs other than packaging' "$tmp/repackage-build.err" || fail 'non-packaging repackaging root was not diagnosed'
# A repackaged package-result must carry its packaging root's distrib commit.
git -C "$root" reset -q --hard "$p_sha"
repackage_role linux 91 "$p_sha" "$distrib_sha"
if WOODPECKER_RELEASE_TEST_ROOT="$tmp/rootfs" CI_PIPELINE_NUMBER=96 CI_COMMIT_SHA="$p_sha" \
  BESKID_RELEASE_CANDIDATE="$source_sha" PATH="$tmp/bin:$PATH" bash "$script" "$version" "${builds[@]}" 2>"$tmp/repackage-distrib.err"; then
  fail 'a repackaged package-result with the build source distrib was accepted'
fi
grep -Fq 'linux package-result identity mismatch' "$tmp/repackage-distrib.err" || fail 'repackaged distrib drift was not diagnosed'
rm -rf "$tmp/rootfs/woodpecker-handoff"; mv "$tmp/handoff-before-repackage" "$tmp/rootfs/woodpecker-handoff"
git -C "$root" reset -q --hard "$source_sha"

# A build number that names no handoff of this source fails before a transaction is created.
if WOODPECKER_RELEASE_TEST_ROOT="$tmp/rootfs" CI_PIPELINE_NUMBER=700 CI_COMMIT_SHA="$source_sha" \
  PATH="$tmp/bin:$PATH" bash "$script" "$version" "$linux_build" "$linux_build" "$windows_build" 2>"$tmp/wrong-build.err"; then
  fail 'release preparation accepted a macOS build without a handoff'
fi
grep -Fq "incoming/${linux_build}-${source_sha}/macos" "$tmp/wrong-build.err" || fail 'missing macOS handoff was not diagnosed'
test ! -e "$tmp/rootfs/woodpecker-output/releases/700-${source_sha}" || fail 'missing handoff created a transaction'

# A handoff renamed to another pipeline still names its own build in UPLOAD_COMPLETE.
cp -R "$tmp/rootfs/woodpecker-handoff/macos/incoming/${macos_build}-${source_sha}" \
  "$tmp/rootfs/woodpecker-handoff/macos/incoming/44-${source_sha}"
if WOODPECKER_RELEASE_TEST_ROOT="$tmp/rootfs" CI_PIPELINE_NUMBER=703 CI_COMMIT_SHA="$source_sha" \
  PATH="$tmp/bin:$PATH" bash "$script" "$version" "$linux_build" 44 "$windows_build" 2>"$tmp/renamed-build.err"; then
  fail 'release preparation accepted a handoff renamed to another pipeline'
fi
grep -Fq 'UPLOAD_COMPLETE identity mismatch: pipeline' "$tmp/renamed-build.err" || fail 'renamed handoff was not diagnosed'
rm -rf "$tmp/rootfs/woodpecker-handoff/macos/incoming/44-${source_sha}"

for bad in 0 abc; do
  if WOODPECKER_RELEASE_TEST_ROOT="$tmp/rootfs" CI_PIPELINE_NUMBER=704 CI_COMMIT_SHA="$source_sha" \
    bash "$script" "$version" "$linux_build" "$macos_build" "$bad" 2>/dev/null; then
    fail "release preparation accepted windows build $bad"
  fi
done
if bash "$script" "$version" "$linux_build" "$macos_build" 2>/dev/null; then fail 'release preparation accepted two builds'; fi

# The handoff itself can be complete while the source-bound compiler report is
# absent. That run must fail before reaching any publication call.
linux_input="$tmp/rootfs/woodpecker-handoff/linux/incoming/${linux_build}-${source_sha}/linux"
rm "$linux_input/release-gate-compiler.json"
(
  cd "$linux_input"
  find . -maxdepth 1 -type f ! -name 'UPLOAD_*' -exec basename {} \; | LC_ALL=C sort | while IFS= read -r name; do shasum -a 256 "$name"; done
) >"$linux_input/UPLOAD_SHA256SUMS"
if WOODPECKER_RELEASE_TEST_ROOT="$tmp/rootfs" CI_PIPELINE_NUMBER=701 CI_COMMIT_SHA="$source_sha" \
  GH_LOG="$tmp/gh.log" GH_REMOTE="$tmp/remote" PATH="$tmp/bin:$PATH" \
  bash "$script" "$version" "${builds[@]}" 2>"$tmp/missing-gate.err"; then
  fail 'release preparation accepted a handoff without compiler gate evidence'
fi
grep -Fq 'release-gate-compiler.json' "$tmp/missing-gate.err" || fail 'missing compiler gate was not diagnosed'
test ! -s "$tmp/gh.log" || fail 'missing compiler gate reached GitHub'
write_role linux

# The CLI inventory and PTY gate is a required Linux handoff component.
linux_input="$tmp/rootfs/woodpecker-handoff/linux/incoming/${linux_build}-${source_sha}/linux"
rm "$linux_input/cli-surface-receipt-v1.json"
(
  cd "$linux_input"
  find . -maxdepth 1 -type f ! -name 'UPLOAD_*' -exec basename {} \; | LC_ALL=C sort | while IFS= read -r name; do shasum -a 256 "$name"; done
) >"$linux_input/UPLOAD_SHA256SUMS"
if WOODPECKER_RELEASE_TEST_ROOT="$tmp/rootfs" CI_PIPELINE_NUMBER=702 CI_COMMIT_SHA="$source_sha" \
  GH_LOG="$tmp/gh.log" GH_REMOTE="$tmp/remote" PATH="$tmp/bin:$PATH" \
  bash "$script" "$version" "${builds[@]}" 2>"$tmp/missing-cli-receipt.err"; then
  fail 'release preparation accepted handoff without CLI surface receipt'
fi
grep -Fq 'cli-surface-receipt-v1.json' "$tmp/missing-cli-receipt.err" || fail 'missing CLI receipt was not diagnosed'
test ! -s "$tmp/gh.log" || fail 'missing CLI receipt reached GitHub'
write_role linux

# A handoff checksum failure is rejected before a transaction is created.
printf 'tampered\n' >>"$tmp/rootfs/woodpecker-handoff/linux/incoming/${linux_build}-${source_sha}/linux/beskid-${version}-amd64.deb"
touch "$tmp/rootfs/woodpecker-handoff/linux/incoming/${linux_build}-${source_sha}/linux/UPLOAD_COMPLETE"
if WOODPECKER_RELEASE_TEST_ROOT="$tmp/rootfs" CI_PIPELINE_NUMBER=71 CI_COMMIT_SHA="$source_sha" \
  bash "$script" "$version" "${builds[@]}" 2>"$tmp/tamper.err"; then
  fail 'tampered handoff was accepted'
fi
grep -Fq 'handoff checksum mismatch' "$tmp/tamper.err" || fail 'tamper rejection was not diagnosed'
test ! -e "$tmp/rootfs/woodpecker-output/releases/71-${source_sha}" || fail 'invalid handoff created a transaction'
write_role linux

# The uploader checksum is necessary but not sufficient: the package result's
# own installer hash remains authoritative before publication.
linux_input="$tmp/rootfs/woodpecker-handoff/linux/incoming/${linux_build}-${source_sha}/linux"
printf 'replaced after packaging\n' >"$linux_input/beskid-${version}-amd64.deb"
(
  cd "$linux_input"
  find . -maxdepth 1 -type f ! -name 'UPLOAD_*' -exec basename {} \; | LC_ALL=C sort | while IFS= read -r name; do shasum -a 256 "$name"; done
) >"$linux_input/UPLOAD_SHA256SUMS"
touch "$linux_input/UPLOAD_COMPLETE"
if WOODPECKER_RELEASE_TEST_ROOT="$tmp/rootfs" CI_PIPELINE_NUMBER=72 CI_COMMIT_SHA="$source_sha" \
  bash "$script" "$version" "${builds[@]}" 2>"$tmp/package-tamper.err"; then
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
  bash "$script" "$version" "${builds[@]}" 2>"$tmp/spoofed-main.err"; then
  fail 'spoofed CI manual/main values authorized publication'
fi
grep -Fq 'clean local main checkout' "$tmp/spoofed-main.err" || fail 'spoofed publication was not rejected by real Git state'
test ! -s "$tmp/gh.log" || fail 'spoofed publication reached GitHub'

printf 'not in the release commit\n' >"$root/untracked-source.bd"
if WOODPECKER_RELEASE_TEST_ROOT="$tmp/rootfs" CI=false CI_PIPELINE_NUMBER=722 CI_COMMIT_SHA="$source_sha" \
  GH_TOKEN=test BESKID_PUBLISH_RELEASE=1 GH_LOG="$tmp/gh.log" GH_REMOTE="$tmp/remote" PATH="$tmp/bin:$PATH" \
  bash "$script" "$version" "${builds[@]}" 2>"$tmp/dirty-main.err"; then
  fail 'dirty local main authorized publication with test root'
fi
grep -Fq 'clean local main checkout' "$tmp/dirty-main.err" || fail 'dirty checkout rejection was not diagnosed'
test ! -s "$tmp/gh.log" || fail 'dirty checkout reached GitHub'
rm "$root/untracked-source.bd"

if WOODPECKER_RELEASE_TEST_ROOT="$tmp/rootfs" CI=true CI_PIPELINE_NUMBER=72 CI_COMMIT_SHA="$source_sha" \
  CI_PIPELINE_EVENT=pull_request CI_COMMIT_BRANCH=main GH_TOKEN=test BESKID_PUBLISH_RELEASE=1 \
  PATH="$tmp/bin:$PATH" bash "$script" "$version" "${builds[@]}"; then
  fail 'pull request publication was accepted'
fi
test ! -s "$tmp/gh.log" || fail 'untrusted publication reached GitHub'

# Trusted publication still requires disposable-VM installer evidence.
: >"$tmp/gh.log"
if WOODPECKER_RELEASE_TEST_ROOT="$tmp/rootfs" CI=false CI_PIPELINE_NUMBER=721 CI_COMMIT_SHA="$source_sha" \
  CI_PIPELINE_EVENT=manual CI_COMMIT_BRANCH=main GH_TOKEN=test BESKID_PUBLISH_RELEASE=1 \
  GH_LOG="$tmp/gh.log" GH_REMOTE="$tmp/remote" PATH="$tmp/bin:$PATH" \
  bash "$script" "$version" "${builds[@]}" 2>"$tmp/missing-smoke.err"; then
  fail 'publication without Windows installer smoke evidence was accepted'
fi
grep -Fq 'BESKID_WINDOWS_INSTALLER_SMOKE_DIR' "$tmp/missing-smoke.err" || fail 'missing installer smoke gate was not diagnosed'
test ! -s "$tmp/gh.log" || fail 'missing installer smoke gate reached GitHub'

# Synthetic evidence passes structural validation but cannot authorize publication.
smoke_dir="$tmp/smoke-evidence"
mkdir "$smoke_dir"
node - "$smoke_dir" "$(sha "$tmp/rootfs/woodpecker-handoff/windows/incoming/${windows_build}-${source_sha}/windows/beskid-${version}-windows-amd64.exe")" \
  "$(sha "$tmp/rootfs/woodpecker-handoff/windows/incoming/${windows_build}-${source_sha}/windows/beskid-${version}-windows-amd64.msi")" <<'NODE'
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
  "$(sha "$tmp/rootfs/woodpecker-handoff/windows/incoming/${windows_build}-${source_sha}/windows/beskid-${version}-windows-amd64.exe")" \
  "$(sha "$tmp/rootfs/woodpecker-handoff/windows/incoming/${windows_build}-${source_sha}/windows/beskid-${version}-windows-amd64.msi")" \
  "$smoke_dir/prerequisites.lock.json" >/dev/null

# Synthetic evidence must never authorize production publication.
: >"$tmp/gh.log"
if WOODPECKER_RELEASE_TEST_ROOT="$tmp/rootfs" CI=false CI_PIPELINE_NUMBER=73 CI_COMMIT_SHA="$source_sha" \
  CI_PIPELINE_EVENT=manual CI_COMMIT_BRANCH=main GH_TOKEN=test BESKID_PUBLISH_RELEASE=1 \
  BESKID_WINDOWS_INSTALLER_SMOKE_DIR="$smoke_dir" \
  GH_LOG="$tmp/gh.log" GH_REMOTE="$tmp/remote" PATH="$tmp/bin:$PATH" \
  bash "$script" "$version" "${builds[@]}" 2>"$tmp/unattested-smoke.err"; then
  fail 'synthetic installer evidence authorized publication'
fi
grep -Fq 'no CI-attested disposable-VM provenance' "$tmp/unattested-smoke.err" || fail 'unattested evidence was not diagnosed'
test ! -s "$tmp/gh.log" || fail 'unattested installer evidence reached GitHub'

# An explicit owner decision is a separate manual-only route. It must name
# this exact source and setup executable, and only then reach publication.
waiver="$tmp/windows-owner-waiver.json"
setup_digest="$(sha "$tmp/rootfs/woodpecker-handoff/windows/incoming/${windows_build}-${source_sha}/windows/beskid-${version}-windows-amd64.exe")"
jq -n --arg source "$source_sha" --arg version "$version" --arg setup "$setup_digest" \
  '{schema_version:1,decision:"release-owner-installer-test-waiver",scope:"windows-installer-scenario-tests-only",source_commit:$source,version:$version,installer_sha256:$setup,approved_utc:"2026-09-28T00:00:00Z"}' >"$waiver"
: >"$tmp/gh.log"
if WOODPECKER_RELEASE_TEST_ROOT="$tmp/rootfs" CI=false CI_PIPELINE_NUMBER=74 CI_COMMIT_SHA="$source_sha" \
  CI_PIPELINE_EVENT=manual CI_COMMIT_BRANCH=main GH_TOKEN=test BESKID_PUBLISH_RELEASE=1 \
  BESKID_WINDOWS_INSTALLER_OWNER_WAIVER_FILE="$waiver" \
  GH_LOG="$tmp/gh.log" GH_REMOTE="$tmp/remote" PATH="$tmp/bin:$PATH" \
  bash "$script" "$version" "${builds[@]}" 2>"$tmp/owner-waiver.err"; then
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
  bash "$script" "$version" "${builds[@]}" 2>"$tmp/inline-waiver.err"; then
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
  bash "$script" "$version" "${builds[@]}" 2>"$tmp/wrong-source-waiver.err"; then
  fail 'owner waiver for another source was accepted'
fi
test ! -s "$tmp/gh.log" || fail 'wrong-source owner waiver reached GitHub'

jq '.installer_sha256="0000000000000000000000000000000000000000000000000000000000000000"' "$waiver" >"$tmp/wrong-installer-waiver.json"
: >"$tmp/gh.log"
if WOODPECKER_RELEASE_TEST_ROOT="$tmp/rootfs" CI=false CI_PIPELINE_NUMBER=76 CI_COMMIT_SHA="$source_sha" \
  CI_PIPELINE_EVENT=manual CI_COMMIT_BRANCH=main GH_TOKEN=test BESKID_PUBLISH_RELEASE=1 \
  BESKID_WINDOWS_INSTALLER_OWNER_WAIVER_FILE="$tmp/wrong-installer-waiver.json" \
  GH_LOG="$tmp/gh.log" GH_REMOTE="$tmp/remote" PATH="$tmp/bin:$PATH" \
  bash "$script" "$version" "${builds[@]}" 2>"$tmp/wrong-installer-waiver.err"; then
  fail 'owner waiver for another installer was accepted'
fi
test ! -s "$tmp/gh.log" || fail 'wrong-installer owner waiver reached GitHub'

ln -s "$waiver" "$tmp/linked-waiver.json"
: >"$tmp/gh.log"
if WOODPECKER_RELEASE_TEST_ROOT="$tmp/rootfs" CI=false CI_PIPELINE_NUMBER=77 CI_COMMIT_SHA="$source_sha" \
  CI_PIPELINE_EVENT=manual CI_COMMIT_BRANCH=main GH_TOKEN=test BESKID_PUBLISH_RELEASE=1 \
  BESKID_WINDOWS_INSTALLER_OWNER_WAIVER_FILE="$tmp/linked-waiver.json" \
  GH_LOG="$tmp/gh.log" GH_REMOTE="$tmp/remote" PATH="$tmp/bin:$PATH" \
  bash "$script" "$version" "${builds[@]}" 2>"$tmp/linked-waiver.err"; then
  fail 'symlinked owner waiver was accepted'
fi
test ! -s "$tmp/gh.log" || fail 'symlinked owner waiver reached GitHub'

jq '.scope="all-release-gates"' "$waiver" >"$tmp/wide-waiver.json"
: >"$tmp/gh.log"
if WOODPECKER_RELEASE_TEST_ROOT="$tmp/rootfs" CI=false CI_PIPELINE_NUMBER=78 CI_COMMIT_SHA="$source_sha" \
  CI_PIPELINE_EVENT=manual CI_COMMIT_BRANCH=main GH_TOKEN=test BESKID_PUBLISH_RELEASE=1 \
  BESKID_WINDOWS_INSTALLER_OWNER_WAIVER_FILE="$tmp/wide-waiver.json" \
  GH_LOG="$tmp/gh.log" GH_REMOTE="$tmp/remote" PATH="$tmp/bin:$PATH" \
  bash "$script" "$version" "${builds[@]}" 2>"$tmp/wide-waiver.err"; then
  fail 'owner waiver with broader scope was accepted'
fi
test ! -s "$tmp/gh.log" || fail 'broader owner waiver reached GitHub'

: >"$tmp/gh.log"
if WOODPECKER_RELEASE_TEST_ROOT="$tmp/rootfs" CI=true CI_PIPELINE_NUMBER=79 CI_COMMIT_SHA="$source_sha" \
  CI_PIPELINE_EVENT=pull_request CI_COMMIT_BRANCH=main GH_TOKEN=test BESKID_PUBLISH_RELEASE=1 \
  BESKID_WINDOWS_INSTALLER_OWNER_WAIVER_FILE="$waiver" \
  GH_LOG="$tmp/gh.log" GH_REMOTE="$tmp/remote" PATH="$tmp/bin:$PATH" \
  bash "$script" "$version" "${builds[@]}" 2>"$tmp/nonmanual-waiver.err"; then
  fail 'owner waiver authorized a nonmanual publication'
fi
test ! -s "$tmp/gh.log" || fail 'nonmanual owner waiver reached GitHub'

# CLI06-06 (0.6): a committed record names the candidate; the release consumes that candidate's build
# handoff, never a build of the record commit. Without a record the 0.6 release is not blocked.
if WOODPECKER_RELEASE_TEST_ROOT="$tmp/rootfs" CI_PIPELINE_NUMBER=80 CI_COMMIT_SHA="$source_sha" \
  PATH="$tmp/bin:$PATH" bash "$script" 0.6.0 42 42 42 2>"$tmp/v06-no-record.err"; then
  fail '0.6 release preparation ran without the candidate build handoff'
fi
grep -Fq 'no record is committed' "$tmp/v06-no-record.err" && fail 'a missing CLI06-06 record blocked the release'
grep -Fq "incoming/42-${source_sha}/linux" "$tmp/v06-no-record.err" || \
  fail '0.6 release without a record did not collect the HEAD candidate'
mkdir -p "$root/docs/release"
printf '{"superrepo_commit":"%s"}\n' "$source_sha" >"$root/docs/release/cli06-06-record-v0.6.0.json"
git -C "$root" add docs/release/cli06-06-record-v0.6.0.json
git -C "$root" -c user.name='Release test' -c user.email='release-test@example.invalid' commit -qm record
record_sha="$(git -C "$root" rev-parse HEAD)"
if WOODPECKER_RELEASE_TEST_ROOT="$tmp/rootfs" CI_PIPELINE_NUMBER=81 CI_COMMIT_SHA="$source_sha" \
  PATH="$tmp/bin:$PATH" bash "$script" 0.6.0 42 42 42 2>"$tmp/v06-pipeline.err"; then
  fail '0.6 release accepted a pipeline commit that is not the checked-out record commit'
fi
grep -Fq 'release pipeline/source identity does not match the checkout' "$tmp/v06-pipeline.err" || \
  fail 'record commit pipeline identity mismatch was not diagnosed'
if WOODPECKER_RELEASE_TEST_ROOT="$tmp/rootfs" CI_PIPELINE_NUMBER=82 CI_COMMIT_SHA="$record_sha" \
  PATH="$tmp/bin:$PATH" bash "$script" 0.6.0 42 42 42 2>"$tmp/v06-handoff.err"; then
  fail '0.6 release preparation ran without the candidate build handoff'
fi
grep -Fq "incoming/42-${source_sha}/linux" "$tmp/v06-handoff.err" || \
  fail '0.6 release did not look for the build handoff of the record candidate'
test "$(node "$root/scripts/ci/release-user-observation.mjs" --source "$root" 0.6.0 "$record_sha")" = "$source_sha" || \
  fail '0.6 release source is not the record candidate'
if WOODPECKER_RELEASE_TEST_ROOT="$tmp/rootfs" CI_PIPELINE_NUMBER=86 CI_COMMIT_SHA="$record_sha" \
  BESKID_RELEASE_CANDIDATE="$record_sha" PATH="$tmp/bin:$PATH" bash "$script" 0.6.0 42 42 42 2>"$tmp/v06-conflict.err"; then
  fail 'a candidate input that differs from the record was accepted'
fi
grep -Fq "differs from the record's candidate" "$tmp/v06-conflict.err" || fail 'record/input conflict was not diagnosed'

echo 'woodpecker release tests OK'
