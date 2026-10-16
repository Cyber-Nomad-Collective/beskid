#!/usr/bin/env bash
# Prepare one three-platform stable release from the collected per-platform build handoffs and, only
# when explicitly enabled, publish its canonical compiler streams and native installers.
#
# Usage: woodpecker-release.sh <version> <linux-build> <macos-build> <windows-build>
#
# Each platform is built by its own pipeline, so each handoff is named by its own pipeline number:
# `<handoff-root>/<role>/incoming/<build>-<source>/<role>`. woodpecker-fetch-handoffs.sh selects them.
#
# Credential handling: never enable xtrace here and never print the
# environment. GH_TOKEN is removed from this shell's exported environment at
# start-up and reaches only `gh` (and the two GitHub publisher scripts) through
# their process environment, never through argv, URLs, files, or git remotes.
set -euo pipefail
set +x
release_token="${GH_TOKEN:-}"
unset GH_TOKEN
gh() { GH_TOKEN="$release_token" command gh "$@"; }
with_token() { GH_TOKEN="$release_token" "$@"; }

[[ "$#" == 4 ]] || { echo 'usage: woodpecker-release.sh <version> <linux-build> <macos-build> <windows-build>' >&2; exit 2; }
requested_version="$1"
roles=(linux macos windows)
builds=("$2" "$3" "$4")
scripts="$(cd "$(dirname "$0")" && pwd)"
repo="$(cd "$scripts/../.." && pwd)"
# Woodpecker's git plugin clones with --depth=1 even when depth: 0 is set; the provenance checks
# below walk ancestry and diff trees from this commit to the build source, so they need full history
# with trees present: the plugin's --filter=tree:0 would fetch every tree lazily, one request each.
if [[ "$(git -C "$repo" rev-parse --is-shallow-repository)" == true ]]; then
  git -C "$repo" fetch --quiet --unshallow --refetch --filter=blob:none --no-tags origin
fi
for index in 0 1 2; do
  [[ "${builds[$index]}" =~ ^[1-9][0-9]*$ ]] || { echo "${roles[$index]} build must be a positive pipeline number" >&2; exit 2; }
done
version="$(node "$scripts/release-version.mjs" "$requested_version" --stable-only)"
head_sha="$(git -C "$repo" rev-parse HEAD)"
# The release runs on HEAD and publishes the per-platform builds of candidate C ($source_sha): the
# candidate named by the committed CLI06-06 record (docs/release/cli06-06-record-v<version>.json), else
# the gate input BESKID_RELEASE_CANDIDATE, else HEAD. C is HEAD or an ancestor of HEAD with HEAD's build
# identity (compiler and beskid_bsol pointers, release-case manifest digest), so root-only
# commits after C (CI scripts, docs, the record) never force a rebuild. A platform may come from its own
# source (BESKID_LINUX_SOURCE, BESKID_MACOS_SOURCE, BESKID_WINDOWS_SOURCE; default C) that has the same
# build identity and differs from C only in non-build root paths.
platform_sources="$(node "$scripts/release-user-observation.mjs" --platform-sources "$repo" "$version" "$head_sha" \
  "${BESKID_RELEASE_CANDIDATE:-}" "${BESKID_LINUX_SOURCE:-}" "${BESKID_MACOS_SOURCE:-}" "${BESKID_WINDOWS_SOURCE:-}")"
source_sha="$(jq -r '.candidate' <<<"$platform_sources")"
declare -A role_source=()
for role in "${roles[@]}"; do role_source[$role]="$(jq -r --arg role "$role" '.sources[$role]' <<<"$platform_sources")"; done
compiler_sha="$(git -C "$repo" rev-parse "$source_sha:compiler")"
pipeline="${CI_PIPELINE_NUMBER:-manual-${builds[0]}-${builds[1]}-${builds[2]}}"
[[ "$pipeline" =~ ^([1-9][0-9]*|manual-[1-9][0-9]*-[1-9][0-9]*-[1-9][0-9]*)$ ]] && \
  [[ -z "${CI_COMMIT_SHA:-}" || "${CI_COMMIT_SHA}" == "$head_sha" ]] || {
  echo 'release pipeline/source identity does not match the checkout' >&2; exit 1;
}
if [[ "${CI_SYSTEM_NAME:-}" == woodpecker ]]; then
  [[ "${CI_PIPELINE_NUMBER:-}" =~ ^[1-9][0-9]*$ && "${CI_COMMIT_SHA:-}" == "$head_sha" ]] || {
    echo 'Woodpecker release preparation requires its own pipeline/source identity' >&2; exit 1;
  }
fi

# The only Woodpecker publication route is the manual main-only release-publish
# lane of the canonical repository, at the exact checked-out commit. The release
# commit is HEAD; it may differ from candidate $source_sha (the record and other
# root-only commits after C), so the lane binds to HEAD, never to C.
woodpecker_publish_lane() {
  [[ "${CI_SYSTEM_NAME:-}" == woodpecker &&
     "${CI_PIPELINE_EVENT:-}" == manual &&
     "${CI_COMMIT_BRANCH:-}" == main &&
     "${CI_REPO:-}" == Cyber-Nomad-Collective/beskid &&
     "${BESKID_TASK:-}" == release-publish &&
     "${CI_COMMIT_SHA:-}" == "$head_sha" ]]
}
if [[ "${CI_SYSTEM_NAME:-}" == woodpecker && "${BESKID_TASK:-}" == release-publish ]] && ! woodpecker_publish_lane; then
  echo 'Woodpecker release-publish requires a manual main pipeline of Cyber-Nomad-Collective/beskid at the checked-out commit' >&2
  exit 1
fi

if [[ "${BESKID_PUBLISH_RELEASE:-0}" == 1 ]]; then
  [[ -n "$release_token" ]] || { echo 'publication requires GH_TOKEN' >&2; exit 1; }
  if [[ "${CI_SYSTEM_NAME:-}" == woodpecker ]]; then
    woodpecker_publish_lane || {
      echo 'Woodpecker publication requires the manual main release-publish lane of Cyber-Nomad-Collective/beskid at the checked-out commit' >&2
      exit 1
    }
  else
    [[ "${BESKID_MANUAL_PUBLISH:-0}" == 1 ]] || {
      echo 'publication requires an external manual publisher and GH_TOKEN' >&2; exit 1;
    }
    [[ "${CI:-}" != true && "$(git -C "$repo" branch --show-current)" == main ]] || {
      echo 'manual publication requires a clean local main checkout' >&2; exit 1;
    }
  fi
  [[ -z "$(git -C "$repo" status --porcelain --untracked-files=normal --ignore-submodules=all)" ]] || {
    echo 'manual publication requires a clean local main checkout' >&2; exit 1;
  }
elif [[ "${BESKID_PUBLISH_RELEASE:-0}" != 0 ]]; then
  echo 'BESKID_PUBLISH_RELEASE must be 0 or 1' >&2; exit 2
fi

test_root="${WOODPECKER_RELEASE_TEST_ROOT:-}"
if [[ -n "$test_root" && "${CI_SYSTEM_NAME:-}" == woodpecker ]]; then
  echo 'WOODPECKER_RELEASE_TEST_ROOT is forbidden in Woodpecker' >&2; exit 2
fi
handoff_root="${test_root%/}/woodpecker-handoff"
output_root="${test_root%/}/woodpecker-output"
[[ -n "$test_root" ]] || { handoff_root=/woodpecker-handoff; output_root=/woodpecker-output; }

# One handoff of one platform: identity (role, its own source, compiler, version, its own pipeline) and checksums.
validate_handoff() {
  node "$scripts/woodpecker-handoff.mjs" validate "$1" "$2" "${role_source[$2]}" "$compiler_sha" "$version" "$3"
}

for index in 0 1 2; do
  role="${roles[$index]}"
  validate_handoff "$handoff_root/$role/incoming/${builds[$index]}-${role_source[$role]}/$role" "$role" "${builds[$index]}" >/dev/null
done

release="$output_root/releases/${pipeline}-${source_sha}"
# The release-publish lane verifies first and then re-validates from a fresh
# snapshot in its publishing step; keep both transactions side by side.
[[ "${CI_SYSTEM_NAME:-}" != woodpecker || "${BESKID_PUBLISH_RELEASE:-0}" != 1 ]] || release="${release}-publish"
mkdir -p "$output_root/releases"
mkdir -m 700 "$release"
mkdir "$release/input" "$release/native"
handoffs="$release/handoffs.json"
printf '{' >"$handoffs"
for index in 0 1 2; do
  role="${roles[$index]}"
  incoming="$handoff_root/$role/incoming/${builds[$index]}-${role_source[$role]}/$role"
  mkdir "$release/input/$role" "$release/native/$role"
  cp -p "$incoming"/* "$release/input/$role/"
  # The private copy is what the release consumes; its identity record names this platform's build.
  [[ "$index" == 0 ]] || printf ',' >>"$handoffs"
  printf '"%s":%s' "$role" "$(validate_handoff "$release/input/$role" "$role" "${builds[$index]}")" >>"$handoffs"
  case "$role" in
    linux) target=x86_64-unknown-linux-gnu; cli=beskid-linux-amd64; lsp=beskid_lsp-linux-amd64 ;;
    macos) target=aarch64-apple-darwin; cli=beskid-darwin-arm64; lsp=beskid_lsp-darwin-arm64 ;;
    windows) target=x86_64-pc-windows-msvc; cli=beskid-windows-amd64.exe; lsp=beskid_lsp-windows-amd64.exe ;;
  esac
  # The native evidence directory is exactly the checksummed packet: every file the worker listed in
  # SHA256SUMS (schema-1 feature logs or the complete schema-2 case packet) plus the checksum list.
  cp "$release/input/$role/SHA256SUMS" "$release/native/$role/"
  while IFS= read -r line; do
    [[ -n "$line" ]] || continue
    name="${line:66}"
    [[ "$name" =~ ^[A-Za-z0-9][A-Za-z0-9._-]*$ ]] || { echo "unsafe packet name in $role SHA256SUMS: $name" >&2; exit 1; }
    cp "$release/input/$role/$name" "$release/native/$role/"
  done <"$release/input/$role/SHA256SUMS"
  for required in "$cli" "$lsp" "beskid-${version}-${target}.tar.gz" "platform-result-${target}.json" woodpecker-build-result.json; do
    [[ -f "$release/native/$role/$required" ]] || { echo "$role packet omits $required" >&2; exit 1; }
  done
  if [[ "$role" == linux ]]; then
    cp "$release/input/linux/cli-surface-evidence-v1.json" \
      "$release/input/linux/cli-surface-receipt-v1.json" "$release/native/linux/"
    for component in compiler corelib; do
      cp "$release/input/linux/release-gate-${component}.json" \
        "$release/input/linux/release-gate-${component}.log" "$release/native/linux/"
    done
    # A repackage that re-issued the compiler gate report retains the build's own report beside it;
    # the aggregator accepts the re-issue only as the repackage lane's exact transformation of it.
    if [[ -e "$release/input/linux/release-gate-compiler.build.json" ]]; then
      cp "$release/input/linux/release-gate-compiler.build.json" "$release/native/linux/"
    fi
  fi
done

printf '}\n' >>"$handoffs"

qualified="$release/qualified"
jq '.sources' <<<"$platform_sources" >"$release/platform-sources.json"
node "$scripts/woodpecker-aggregate-release.mjs" "$release/native" "$qualified" \
  "$version" "$source_sha" "$compiler_sha" "$handoffs" "$release/platform-sources.json" >/dev/null
state="$qualified/release-state.json"
assets="$qualified/assets"

# CLI06-06: the five-participant uncoached observation is a published, non-blocking quality target.
# The report (status pass, below-threshold or not-performed) is stored in the release state and printed
# in the release notes. A committed record is validated strictly against candidate $source_sha and the
# CLI digests of its collected builds; an invalid or forged record fails here, before installer work.
observation="$(node "$scripts/release-user-observation.mjs" --release "$repo" "$version" "$head_sha" "$source_sha" "$compiler_sha" \
  "$qualified/validated-evidence.json")"
node - "$state" "$observation" <<'NODE'
const {readFileSync,renameSync,writeFileSync}=require('node:fs');
const [path,report]=process.argv.slice(2),state=JSON.parse(readFileSync(path,'utf8'));
state.user_observation=JSON.parse(report);
const temporary=`${path}.observation.tmp`;
writeFileSync(temporary,`${JSON.stringify(state,null,2)}\n`,{flag:'wx'});
renameSync(temporary,path);
NODE
jq -r '.user_observation.summary' "$state"

# The release evidence names each platform's handoff source and the build identity they share.
node - "$state" "$platform_sources" <<'NODE'
const {readFileSync,renameSync,writeFileSync}=require('node:fs');
const [path,resolved]=process.argv.slice(2),state=JSON.parse(readFileSync(path,'utf8')),{build_identity,sources}=JSON.parse(resolved);
state.build_identity=build_identity;
state.platform_sources=sources;
const temporary=`${path}.identity.tmp`;
writeFileSync(temporary,`${JSON.stringify(state,null,2)}\n`,{flag:'wx'});
renameSync(temporary,path);
NODE

# Packaging identity. A handoff's installers were packaged by its build source, or, for a repackaged
# handoff, by the repackaging root its UPLOAD_COMPLETE and package-result both name: a descendant of
# the source that changes only packaging inputs (release-user-observation.mjs --packaging-root). Each
# package-result must carry the distrib commit of that packaging root.
declare -A role_distrib=()
for index in 0 1 2; do
  role="${roles[$index]}"
  result="$release/input/$role/package-result.json"
  packaged_pipeline="$(jq -r '.packaged_by.pipeline // empty' "$result")"
  packaged_commit="$(jq -r '.packaged_by.superrepo_commit // empty' "$result")"
  packaged_build="$(jq -r '.packaged_by.build_pipeline // empty' "$result")"
  marker_pipeline="$(jq -r --arg role "$role" '.[$role].packaged_by // empty' "$handoffs")"
  marker_commit="$(jq -r --arg role "$role" '.[$role].packaged_by_commit // empty' "$handoffs")"
  # A superseding repackage names the packaging it replaced in both records.
  packaged_supersedes="$(jq -r '.packaged_by.supersedes // empty' "$result")"
  marker_supersedes="$(jq -r --arg role "$role" '.[$role].supersedes // empty' "$handoffs")"
  [[ "$packaged_pipeline" == "$marker_pipeline" && "$packaged_commit" == "$marker_commit" && "$packaged_supersedes" == "$marker_supersedes" ]] || {
    echo "$role package-result packaging identity differs from its UPLOAD_COMPLETE" >&2; exit 1;
  }
  [[ -z "$packaged_pipeline" || "$packaged_build" == "${builds[$index]}" ]] || {
    echo "$role package-result was repackaged from another build pipeline" >&2; exit 1;
  }
  role_distrib[$role]="$(node "$scripts/release-user-observation.mjs" --packaging-root "$repo" "${role_source[$role]}" \
    "${packaged_commit:-${role_source[$role]}}" "$head_sha" | jq -r '.distrib_commit')"
done
distrib_commits="$(jq -n --arg linux "${role_distrib[linux]}" --arg macos "${role_distrib[macos]}" --arg windows "${role_distrib[windows]}" '{linux:$linux,macos:$macos,windows:$windows}')"

installers=()
for role in "${roles[@]}"; do
  package_list="$release/package-${role}.list"
  node - "$release/input/$role" "$role" "${role_source[$role]}" "$compiler_sha" "${role_distrib[$role]}" "$version" >"$package_list" <<'NODE'
const {createHash}=require("node:crypto"),{lstatSync,readFileSync}=require("node:fs"),{join}=require("node:path");
const [dir,role,source,compiler,distrib,version]=process.argv.slice(2), result=JSON.parse(readFileSync(join(dir,"package-result.json"),"utf8"));
const target={linux:"x86_64-unknown-linux-gnu",macos:"aarch64-apple-darwin",windows:"x86_64-pc-windows-msvc"}[role];
const required={linux:[`beskid-${version}-amd64.deb`],macos:[`beskid-${version}-macos-arm64.dmg`],windows:[`beskid-${version}-windows-amd64.msi`,`beskid-${version}-windows-amd64.exe`]}[role];
const allowed=new Set(role==="macos"?[...required,"beskid.rb"]:required);
const fail=m=>{throw new Error(m)}, digest=p=>createHash("sha256").update(readFileSync(p)).digest("hex");
if(result.schema_version!==1||result.platform!==role||result.target!==target||result.version!==version||result.status!=="success"||result.published!==false||result.distrib_commit!==distrib||result.source?.superrepo_commit!==source||result.source?.compiler_commit!==compiler) fail(`${role} package-result identity mismatch`);
if(result.bundle_sha256!==digest(join(dir,`beskid-${version}-${target}.tar.gz`))) fail(`${role} package-result bundle hash mismatch`);
const names=Array.isArray(result.artifacts)?result.artifacts.map(a=>a.name):[];
if(names.length!==new Set(names).size||names.some(name=>!allowed.has(name))||required.some(name=>!names.includes(name))) fail(`${role} package-result artifact inventory mismatch`);
for(const artifact of result.artifacts){const path=join(dir,artifact.name),st=lstatSync(path);if(st.isSymbolicLink()||!st.isFile()||artifact.sha256!==digest(path))fail(`${role} installer checksum mismatch: ${artifact.name}`);if(artifact.name!=="beskid.rb")console.log(artifact.name);}
NODE
  while IFS= read -r name; do installers+=("$name"); done <"$package_list"
done

# The release state is the single public version authority. Native aggregation
# creates it first; enrich it only with installers whose package-result record
# has already been checksum-validated above.
node - "$state" "$version" "$platform_sources" "$compiler_sha" "$distrib_commits" \
  "$release/input/linux" "$release/input/macos" "$release/input/windows" <<'NODE'
const {createHash}=require("node:crypto"),{readFileSync,renameSync,writeFileSync}=require("node:fs"),{join}=require("node:path");
const [statePath,version,resolved,compiler,distribJson,...dirs]=process.argv.slice(2),{candidate:source,sources}=JSON.parse(resolved),commits=JSON.parse(distribJson);
const fail=m=>{throw new Error(m)}, digest=p=>createHash("sha256").update(readFileSync(p)).digest("hex");
const state=JSON.parse(readFileSync(statePath,"utf8"));
if(state.version!==version||state.provenance?.superrepo_commit!==source||state.provenance?.compiler_commit!==compiler)fail("qualified release state identity mismatch");
const expected={linux:[`beskid-${version}-amd64.deb`],macos:[`beskid-${version}-macos-arm64.dmg`,`beskid.rb`],windows:[`beskid-${version}-windows-amd64.msi`,`beskid-${version}-windows-amd64.exe`]};
const packages=[], formulas=[];
for(const dir of dirs){
  const result=JSON.parse(readFileSync(join(dir,"package-result.json"),"utf8"));
  if(!expected[result.platform]||result.version!==version||result.distrib_commit!==commits[result.platform]||result.source?.superrepo_commit!==sources[result.platform]||result.source?.compiler_commit!==compiler||result.status!=="success")fail(`${result.platform||"unknown"} package-result identity mismatch`);
  const names=(result.artifacts||[]).map(a=>a?.name);
  if(names.length!==expected[result.platform].length||expected[result.platform].some(name=>!names.includes(name)))fail(`${result.platform} package-result inventory mismatch`);
  for(const artifact of result.artifacts){
    if(!artifact||typeof artifact.name!=="string"||typeof artifact.sha256!=="string"||artifact.sha256!==digest(join(dir,artifact.name)))fail(`${result.platform} package-result checksum mismatch: ${artifact?.name}`);
    const entry={platform:result.platform,name:artifact.name,sha256:artifact.sha256,distrib_commit:result.distrib_commit,...(result.packaged_by?{packaged_by:result.packaged_by}:{})};
    if(artifact.name==="beskid.rb")formulas.push(entry);else packages.push(entry);
  }
}
if(formulas.length!==1)fail("expected exactly one Homebrew formula");
state.available_artifacts=[...new Set([...state.available_artifacts,...packages.map(item=>item.name)])].sort();
// One distrib commit when every platform was packaged with the same one, else null; `commits` names each.
const unique=[...new Set(Object.values(commits))];
state.distribution={schema_version:1,commit:unique.length===1?unique[0]:null,commits,packages:packages.sort((a,b)=>a.name.localeCompare(b.name)),homebrew_formula:formulas[0]};
const temporary=`${statePath}.tmp`;
writeFileSync(temporary,`${JSON.stringify(state,null,2)}\n`,{flag:"wx"});
renameSync(temporary,statePath);
NODE
for name in "${installers[@]}"; do
  role=linux; [[ "$name" == *macos* ]] && role=macos; [[ "$name" == *windows* ]] && role=windows
  cp "$release/input/$role/$name" "$qualified/assets/$name"
done
cp "$release/input/macos/beskid.rb" "$assets/beskid.rb"
release_assets=("${installers[@]}" beskid.rb)

owner_waiver_file="${BESKID_WINDOWS_INSTALLER_OWNER_WAIVER_FILE:-}"
owner_waiver_json="${BESKID_WINDOWS_INSTALLER_OWNER_WAIVER_JSON:-}"
if [[ -n "$owner_waiver_file" || -n "$owner_waiver_json" ]]; then
  [[ -z "$owner_waiver_file" || -z "$owner_waiver_json" ]] || {
    echo 'provide only one Windows installer owner waiver input' >&2; exit 1;
  }
  # Preparation validates a supplied record too, so the release-publish lane
  # rejects a wrong waiver before its credentialed step starts.
  # This manual-only exception records the release owner's decision, not a
  # claim that the unrun scenario matrix passed. Bind it to the checked-out
  # source and to the exact installer already verified by package-result.
  if [[ -n "$owner_waiver_file" ]]; then
    owner_waiver="$(node "$scripts/windows-installer-owner-waiver.mjs" "$owner_waiver_file" \
      "${role_source[windows]}" "$version" "$assets/beskid-${version}-windows-amd64.exe")"
  else
    owner_waiver="$(node "$scripts/windows-installer-owner-waiver.mjs" --json "$owner_waiver_json" \
      "${role_source[windows]}" "$version" "$assets/beskid-${version}-windows-amd64.exe")"
  fi
  node - "$state" "$owner_waiver" <<'NODE'
const {readFileSync,renameSync,writeFileSync}=require('node:fs');
const [path,record]=process.argv.slice(2),state=JSON.parse(readFileSync(path,'utf8'));
state.windows_installer_acceptance=JSON.parse(record);
const temporary=`${path}.waiver.tmp`;
writeFileSync(temporary,`${JSON.stringify(state,null,2)}\n`,{flag:'wx'});
renameSync(temporary,path);
NODE
elif [[ "${BESKID_PUBLISH_RELEASE:-0}" == 1 ]]; then
  smoke_dir="${BESKID_WINDOWS_INSTALLER_SMOKE_DIR:-}"
  [[ -n "$smoke_dir" && -d "$smoke_dir" ]] || {
    echo 'BESKID_WINDOWS_INSTALLER_SMOKE_DIR or a Windows installer owner waiver is required before publication' >&2
    exit 1
  }
  # Structural evidence alone does not authenticate the disposable VM or its
  # transfer path. An attested path can be added separately in the future.
  echo 'Windows installer smoke evidence has no CI-attested disposable-VM provenance or trusted transfer path; publication is blocked' >&2
  exit 1
fi

if [[ "${BESKID_PUBLISH_RELEASE:-0}" == 0 ]]; then
  echo "Woodpecker release prepared: $qualified"
  exit 0
fi

for stream in cli lsp bundle; do
  with_token bash "$scripts/publish-release-stream.sh" "$stream" "$version" "$compiler_sha" "$assets" immutable stable "$state"
done

# Preflight every existing immutable installer before uploading any missing one.
remote="$(gh release view "cli-v${version}" --repo Cyber-Nomad-Collective/beskid_compiler --json assets --jq '.assets[].name')"
check_dir="$(mktemp -d)"; trap 'rm -rf "$check_dir"' EXIT
missing=()
for name in "${release_assets[@]}"; do
  if grep -Fxq -- "$name" <<<"$remote"; then
    gh release download "cli-v${version}" --repo Cyber-Nomad-Collective/beskid_compiler --pattern "$name" --dir "$check_dir"
    cmp -s "$assets/$name" "$check_dir/$name" || { echo "immutable installer differs: $name" >&2; exit 1; }
  else
    missing+=("$assets/$name")
  fi
done
[[ "${#missing[@]}" == 0 ]] || gh release upload "cli-v${version}" --repo Cyber-Nomad-Collective/beskid_compiler "${missing[@]}"
with_token bash "$scripts/publish-homebrew-formula.sh" "$assets/beskid.rb" "$version"

for stream in cli lsp bundle; do
  with_token bash "$scripts/publish-release-stream.sh" "$stream" "$version" "$compiler_sha" "$assets" rolling stable "$state"
done
gh release upload cli-stable --repo Cyber-Nomad-Collective/beskid_compiler "${release_assets[@]/#/$assets/}" --clobber
echo "Woodpecker release published: $version (source $source_sha, release commit $head_sha)"
