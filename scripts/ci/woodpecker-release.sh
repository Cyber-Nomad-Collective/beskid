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
pipeline="${CI_PIPELINE_NUMBER:-}"
[[ "$pipeline" =~ ^[1-9][0-9]*$ && "${CI_COMMIT_SHA:-}" == "$source_sha" ]] || {
  echo 'release pipeline/source identity does not match the checkout' >&2; exit 1;
}

test_root="${WOODPECKER_RELEASE_TEST_ROOT:-}"
if [[ -n "$test_root" && "${CI_SYSTEM_NAME:-}" == woodpecker ]]; then
  echo 'WOODPECKER_RELEASE_TEST_ROOT is forbidden in Woodpecker' >&2; exit 2
fi
handoff_root="${test_root%/}/woodpecker-handoff"
output_root="${test_root%/}/woodpecker-output"
[[ -n "$test_root" ]] || { handoff_root=/woodpecker-handoff; output_root=/woodpecker-output; }

if [[ "${BESKID_PUBLISH_RELEASE:-0}" == 1 ]]; then
  [[ "${CI:-}" == true && "${CI_PIPELINE_EVENT:-}" == manual && "${CI_COMMIT_BRANCH:-}" == main && -n "${GH_TOKEN:-}" ]] || {
    echo 'publication requires CI manual main and GH_TOKEN' >&2; exit 1;
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
const markerTime=stat(join(dir,marker)).mtimeMs;
if(names.some(name=>name!==marker&&stat(join(dir,name)).mtimeMs>markerTime)) fail("UPLOAD_COMPLETE was not uploaded last");
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
done

qualified="$release/qualified"
node "$scripts/woodpecker-aggregate-release.mjs" "$release/native" "$qualified" \
  "$version" "$source_sha" "$compiler_sha" >/dev/null

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
for name in "${installers[@]}"; do
  role=linux; [[ "$name" == *macos* ]] && role=macos; [[ "$name" == *windows* ]] && role=windows
  cp "$release/input/$role/$name" "$qualified/assets/$name"
done

if [[ "${BESKID_PUBLISH_RELEASE:-0}" == 0 ]]; then
  echo "Woodpecker release prepared: $qualified"
  exit 0
fi

state="$qualified/release-state.json"; assets="$qualified/assets"
for stream in cli lsp bundle; do
  bash "$scripts/publish-release-stream.sh" "$stream" "$version" "$compiler_sha" "$assets" immutable stable "$state"
done

# Preflight every existing immutable installer before uploading any missing one.
remote="$(gh release view "cli-v${version}" --repo Cyber-Nomad-Collective/beskid_compiler --json assets --jq '.assets[].name')"
check_dir="$(mktemp -d)"; trap 'rm -rf "$check_dir"' EXIT
missing=()
for name in "${installers[@]}"; do
  if grep -Fxq -- "$name" <<<"$remote"; then
    gh release download "cli-v${version}" --repo Cyber-Nomad-Collective/beskid_compiler --pattern "$name" --dir "$check_dir"
    cmp -s "$assets/$name" "$check_dir/$name" || { echo "immutable installer differs: $name" >&2; exit 1; }
  else
    missing+=("$assets/$name")
  fi
done
[[ "${#missing[@]}" == 0 ]] || gh release upload "cli-v${version}" --repo Cyber-Nomad-Collective/beskid_compiler "${missing[@]}"

for stream in cli lsp bundle; do
  bash "$scripts/publish-release-stream.sh" "$stream" "$version" "$compiler_sha" "$assets" rolling stable "$state"
done
gh release upload cli-stable --repo Cyber-Nomad-Collective/beskid_compiler "${installers[@]/#/$assets/}" --clobber
echo "Woodpecker release published: $version ($source_sha)"
