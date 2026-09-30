#!/usr/bin/env bash
# Prepare one three-platform stable release and, only when explicitly enabled,
# publish its canonical compiler streams and native installers.
set -euo pipefail

[[ "$#" == 2 ]] || { echo 'usage: woodpecker-release.sh <build-run> <version>' >&2; exit 2; }
build_run="$1"; requested_version="$2"
scripts="$(cd "$(dirname "$0")" && pwd)"
repo="$(cd "$scripts/../.." && pwd)"
[[ "$build_run" =~ ^[1-9][0-9]*$ ]] || { echo 'build run must be a positive pipeline number' >&2; exit 2; }
version="$(node "$scripts/release-version.mjs" "$requested_version" --stable-only)"
source_sha="$(git -C "$repo" rev-parse HEAD)"
compiler_sha="$(git -C "$repo" rev-parse HEAD:compiler)"
distrib_sha="$(git -C "$repo" rev-parse HEAD:beskid_distrib)"
pipeline="${CI_PIPELINE_NUMBER:-manual-${build_run}}"
[[ "$pipeline" =~ ^([1-9][0-9]*|manual-[1-9][0-9]*)$ ]] && \
  [[ -z "${CI_COMMIT_SHA:-}" || "${CI_COMMIT_SHA}" == "$source_sha" ]] || {
  echo 'release pipeline/source identity does not match the checkout' >&2; exit 1;
}
if [[ "${CI_SYSTEM_NAME:-}" == woodpecker ]]; then
  [[ "${CI_PIPELINE_NUMBER:-}" =~ ^[1-9][0-9]*$ && "${CI_COMMIT_SHA:-}" == "$source_sha" ]] || {
    echo 'Woodpecker release preparation requires its own pipeline/source identity' >&2; exit 1;
  }
fi

test_root="${WOODPECKER_RELEASE_TEST_ROOT:-}"
if [[ -n "$test_root" && "${CI_SYSTEM_NAME:-}" == woodpecker ]]; then
  echo 'WOODPECKER_RELEASE_TEST_ROOT is forbidden in Woodpecker' >&2; exit 2
fi
handoff_root="${test_root%/}/woodpecker-handoff"
output_root="${test_root%/}/woodpecker-output"
[[ -n "$test_root" ]] || { handoff_root=/woodpecker-handoff; output_root=/woodpecker-output; }

if [[ "${BESKID_PUBLISH_RELEASE:-0}" == 1 ]]; then
  [[ "${CI_SYSTEM_NAME:-}" != woodpecker && "${BESKID_MANUAL_PUBLISH:-0}" == 1 && -n "${GH_TOKEN:-}" ]] || {
    echo 'publication requires an external manual publisher and GH_TOKEN' >&2; exit 1;
  }
  [[ "${CI:-}" != true && "$(git -C "$repo" branch --show-current)" == main ]] || {
    echo 'manual publication requires a clean local main checkout' >&2; exit 1;
  }
  [[ -z "$(git -C "$repo" status --porcelain --untracked-files=normal --ignore-submodules=all)" ]] || {
    echo 'manual publication requires a clean local main checkout' >&2; exit 1;
  }
elif [[ "${BESKID_PUBLISH_RELEASE:-0}" != 0 ]]; then
  echo 'BESKID_PUBLISH_RELEASE must be 0 or 1' >&2; exit 2
fi

validate_handoff() {
  node - "$1" "$2" "$source_sha" "$compiler_sha" "$version" "$build_run" <<'NODE'
const {createHash}=require("node:crypto"), {lstatSync,readdirSync,readFileSync}=require("node:fs"), {join}=require("node:path");
const [dir,role,source,compiler,version,pipeline]=process.argv.slice(2);
const fail=m=>{throw new Error(m)}, stat=p=>{try{return lstatSync(p)}catch{fail(`missing handoff file: ${p}`)}};
const root=stat(dir); if(root.isSymbolicLink()||!root.isDirectory()) fail("handoff role is not a real directory");
const names=readdirSync(dir), marker="UPLOAD_COMPLETE", sumsName="UPLOAD_SHA256SUMS";
for(const name of names){
  if(!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(name)) fail(`unsafe handoff name: ${name}`);
  const item=stat(join(dir,name)); if(item.isSymbolicLink()||!item.isFile()) fail(`handoff entry is not a regular file: ${name}`);
}
if(!names.includes(marker)||!names.includes(sumsName)) fail("handoff is incomplete");
const fields={}; for(const line of readFileSync(join(dir,marker),"utf8").trimEnd().split("\n")){
  const match=/^([a-z]+)=(.*)$/.exec(line); if(!match||fields[match[1]]!==undefined) fail("invalid UPLOAD_COMPLETE"); fields[match[1]]=match[2];
}
const expected={role,source,compiler,version,pipeline};
if(Object.keys(fields).length!==5||Object.entries(expected).some(([key,value])=>fields[key]!==value)) fail("UPLOAD_COMPLETE identity mismatch");
const payload=names.filter(name=>!name.startsWith("UPLOAD_")).sort(), sums=new Map();
for(const line of readFileSync(join(dir,sumsName),"utf8").split(/\r?\n/)){
  if(!line) continue; const match=/^([0-9a-fA-F]{64}) [ *]([^/\\]+)$/.exec(line);
  if(!match||sums.has(match[2])) fail("malformed or repeated handoff checksum"); sums.set(match[2],match[1].toLowerCase());
}
if(payload.length!==sums.size||payload.some(name=>!sums.has(name))) fail("handoff checksum inventory mismatch");
for(const name of payload){const actual=createHash("sha256").update(readFileSync(join(dir,name))).digest("hex"); if(actual!==sums.get(name)) fail(`handoff checksum mismatch: ${name}`);}
NODE
}

roles=(linux macos windows)
for role in "${roles[@]}"; do
  incoming="$handoff_root/$role/incoming/${build_run}-${source_sha}/$role"
  validate_handoff "$incoming" "$role"
done

release="$output_root/releases/${pipeline}-${source_sha}"
mkdir -p "$output_root/releases"
mkdir -m 700 "$release"
mkdir "$release/input" "$release/native"
for role in "${roles[@]}"; do
  incoming="$handoff_root/$role/incoming/${build_run}-${source_sha}/$role"
  mkdir "$release/input/$role" "$release/native/$role"
  cp -p "$incoming"/* "$release/input/$role/"
  validate_handoff "$release/input/$role" "$role"
  case "$role" in
    linux) target=x86_64-unknown-linux-gnu; cli=beskid-linux-amd64; lsp=beskid_lsp-linux-amd64 ;;
    macos) target=aarch64-apple-darwin; cli=beskid-darwin-arm64; lsp=beskid_lsp-darwin-arm64 ;;
    windows) target=x86_64-pc-windows-msvc; cli=beskid-windows-amd64.exe; lsp=beskid_lsp-windows-amd64.exe ;;
  esac
  cp "$release/input/$role/$cli" "$release/input/$role/$lsp" \
    "$release/input/$role/beskid-${version}-${target}.tar.gz" \
    "$release/input/$role/platform-result-${target}.json" \
    "$release/input/$role/woodpecker-build-result.json" \
    "$release/input/$role/SHA256SUMS" "$release/native/$role/"
  cp "$release/input/$role/feature-evidence-v1.json" "$release/native/$role/"
  for feature_log in "$release/input/$role"/feature-*.json; do
    [[ "${feature_log##*/}" == feature-evidence-v1.json ]] || cp "$feature_log" "$release/native/$role/"
  done
  if [[ "$role" == linux ]]; then
    for component in compiler corelib; do
      cp "$release/input/linux/release-gate-${component}.json" \
        "$release/input/linux/release-gate-${component}.log" "$release/native/linux/"
    done
  fi
done

qualified="$release/qualified"
node "$scripts/woodpecker-aggregate-release.mjs" "$release/native" "$qualified" \
  "$version" "$source_sha" "$compiler_sha" >/dev/null
state="$qualified/release-state.json"
assets="$qualified/assets"

installers=()
for role in "${roles[@]}"; do
  package_list="$release/package-${role}.list"
  node - "$release/input/$role" "$role" "$source_sha" "$compiler_sha" "$distrib_sha" "$version" >"$package_list" <<'NODE'
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
node - "$state" "$version" "$source_sha" "$compiler_sha" "$distrib_sha" \
  "$release/input/linux" "$release/input/macos" "$release/input/windows" <<'NODE'
const {createHash}=require("node:crypto"),{readFileSync,renameSync,writeFileSync}=require("node:fs"),{join}=require("node:path");
const [statePath,version,source,compiler,distrib,...dirs]=process.argv.slice(2);
const fail=m=>{throw new Error(m)}, digest=p=>createHash("sha256").update(readFileSync(p)).digest("hex");
const state=JSON.parse(readFileSync(statePath,"utf8"));
if(state.version!==version||state.provenance?.superrepo_commit!==source||state.provenance?.compiler_commit!==compiler)fail("qualified release state identity mismatch");
const expected={linux:[`beskid-${version}-amd64.deb`],macos:[`beskid-${version}-macos-arm64.dmg`,`beskid.rb`],windows:[`beskid-${version}-windows-amd64.msi`,`beskid-${version}-windows-amd64.exe`]};
const packages=[], formulas=[];
for(const dir of dirs){
  const result=JSON.parse(readFileSync(join(dir,"package-result.json"),"utf8"));
  if(!expected[result.platform]||result.version!==version||result.distrib_commit!==distrib||result.source?.superrepo_commit!==source||result.source?.compiler_commit!==compiler||result.status!=="success")fail(`${result.platform||"unknown"} package-result identity mismatch`);
  const names=(result.artifacts||[]).map(a=>a?.name);
  if(names.length!==expected[result.platform].length||expected[result.platform].some(name=>!names.includes(name)))fail(`${result.platform} package-result inventory mismatch`);
  for(const artifact of result.artifacts){
    if(!artifact||typeof artifact.name!=="string"||typeof artifact.sha256!=="string"||artifact.sha256!==digest(join(dir,artifact.name)))fail(`${result.platform} package-result checksum mismatch: ${artifact?.name}`);
    const entry={platform:result.platform,name:artifact.name,sha256:artifact.sha256};
    if(artifact.name==="beskid.rb")formulas.push(entry);else packages.push(entry);
  }
}
if(formulas.length!==1)fail("expected exactly one Homebrew formula");
state.available_artifacts=[...new Set([...state.available_artifacts,...packages.map(item=>item.name)])].sort();
state.distribution={schema_version:1,commit:distrib,packages:packages.sort((a,b)=>a.name.localeCompare(b.name)),homebrew_formula:formulas[0]};
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

if [[ "${BESKID_PUBLISH_RELEASE:-0}" == 0 ]]; then
  echo "Woodpecker release prepared: $qualified"
  exit 0
fi

owner_waiver_file="${BESKID_WINDOWS_INSTALLER_OWNER_WAIVER_FILE:-}"
owner_waiver_json="${BESKID_WINDOWS_INSTALLER_OWNER_WAIVER_JSON:-}"
if [[ -n "$owner_waiver_file" || -n "$owner_waiver_json" ]]; then
  [[ -z "$owner_waiver_file" || -z "$owner_waiver_json" ]] || {
    echo 'provide only one Windows installer owner waiver input' >&2; exit 1;
  }
  # This manual-only exception records the release owner's decision, not a
  # claim that the unrun scenario matrix passed. Bind it to the checked-out
  # source and to the exact installer already verified by package-result.
  if [[ -n "$owner_waiver_file" ]]; then
    owner_waiver="$(node "$scripts/windows-installer-owner-waiver.mjs" "$owner_waiver_file" \
      "$source_sha" "$version" "$assets/beskid-${version}-windows-amd64.exe")"
  else
    owner_waiver="$(node "$scripts/windows-installer-owner-waiver.mjs" --json "$owner_waiver_json" \
      "$source_sha" "$version" "$assets/beskid-${version}-windows-amd64.exe")"
  fi
  node - "$state" "$owner_waiver" <<'NODE'
const {readFileSync,renameSync,writeFileSync}=require('node:fs');
const [path,record]=process.argv.slice(2),state=JSON.parse(readFileSync(path,'utf8'));
state.windows_installer_acceptance=JSON.parse(record);
const temporary=`${path}.waiver.tmp`;
writeFileSync(temporary,`${JSON.stringify(state,null,2)}\n`,{flag:'wx'});
renameSync(temporary,path);
NODE
else
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

for stream in cli lsp bundle; do
  bash "$scripts/publish-release-stream.sh" "$stream" "$version" "$compiler_sha" "$assets" immutable stable "$state"
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
bash "$scripts/publish-homebrew-formula.sh" "$assets/beskid.rb" "$version"

for stream in cli lsp bundle; do
  bash "$scripts/publish-release-stream.sh" "$stream" "$version" "$compiler_sha" "$assets" rolling stable "$state"
done
gh release upload cli-stable --repo Cyber-Nomad-Collective/beskid_compiler "${release_assets[@]/#/$assets/}" --clobber
echo "Woodpecker release published: $version ($source_sha)"
