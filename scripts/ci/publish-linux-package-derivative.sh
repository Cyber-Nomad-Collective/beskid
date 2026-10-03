#!/usr/bin/env bash
set -euo pipefail
intent="${1:?usage: publish-linux-package-derivative.sh <intent.json> <correction-dir>}"
directory="${2:?usage: publish-linux-package-derivative.sh <intent.json> <correction-dir>}"
repo="Cyber-Nomad-Collective/beskid_compiler"
metadata=$(node - "$intent" <<'NODE'
const fs=require('fs'); const x=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
if(x?.schema_version!==1||x?.kind!=="linux-package-derivative-correction"||!/^[0-9]+\.[0-9]+\.[0-9]+$/.test(x.version)||!/^[A-Za-z0-9][A-Za-z0-9._-]*\.deb$/.test(x?.artifact?.name||'')||!/^[A-Za-z0-9][A-Za-z0-9._-]*\.correction-v[1-9][0-9]*\.json$/.test(x?.record?.name||''))process.exit(1);
console.log(`cli-v${x.version}`);console.log(x.artifact.name);console.log(x.record.name);console.log(x.artifact.sha256);console.log(x.native.compiler_commit);
NODE
)
IFS=$'\n'; fields=($metadata); unset IFS
[[ ${#fields[@]} -eq 5 ]] || { echo 'invalid correction intent' >&2; exit 1; }
tag="${fields[0]}"; deb="${fields[1]}"; record="${fields[2]}"; expected_deb="${fields[3]}"; compiler="${fields[4]}"
sha(){ if command -v sha256sum >/dev/null;then sha256sum "$1"|awk '{print $1}';else shasum -a 256 "$1"|awk '{print $1}';fi; }
regular(){ [[ -f "$1" && ! -L "$1" ]] || { echo "not a regular file: $1" >&2; exit 1; }; }
regular "$directory/$deb"; regular "$directory/$record"; regular "$directory/correction-intent.json"
[[ "$(find "$directory" -mindepth 1 -maxdepth 1 -type f -o -type l | wc -l | tr -d ' ')" == 3 ]] || { echo 'correction directory has an unexpected inventory' >&2; exit 1; }
[[ "$(sha "$directory/$deb")" == "$expected_deb" ]] || { echo 'local DEB digest does not match intent' >&2; exit 1; }
cmp -s "$intent" "$directory/correction-intent.json" || { echo 'generated correction intent differs from reviewed intent' >&2; exit 1; }
node - "$intent" "$directory/$record" <<'NODE'
const fs=require('fs');const [i,r]=process.argv.slice(2).map(p=>JSON.parse(fs.readFileSync(p,'utf8')));if(r.schema_version!==1||r.kind!==i.kind||r.version!==i.version||r.platform!==i.platform||JSON.stringify(r.native)!==JSON.stringify(i.native)||JSON.stringify(r.recipe)!==JSON.stringify(i.recipe)||JSON.stringify(r.artifact)!==JSON.stringify(i.artifact)||JSON.stringify(r.qualification)!==JSON.stringify(i.qualification))process.exit(1);
NODE
view="$(gh release view "$tag" --repo "$repo" --json targetCommitish,assets)" || { echo "immutable release ${tag} is absent or unreadable" >&2; exit 1; }
IFS=$'\n'; present=($(VIEW="$view" node - "$compiler" "$deb" "$record" <<'NODE'
const [commit,...names]=process.argv.slice(2),v=JSON.parse(process.env.VIEW);if(v.targetCommitish!==commit)process.exit(2);const assets=new Set((v.assets||[]).map(a=>a.name));for(const name of names)console.log(assets.has(name)?'present':'absent');
NODE
)); unset IFS
[[ ${#present[@]} -eq 2 ]] || { echo 'immutable release preflight is malformed' >&2; exit 1; }
tmp="$(mktemp -d)";trap 'rm -rf "$tmp"' EXIT
for index in 0 1;do
  asset="${deb}"; [[ "$index" == 1 ]] && asset="$record"
  [[ "${present[$index]}" == present ]] || continue
  gh release download "$tag" --repo "$repo" --pattern "$asset" --dir "$tmp" || { echo "cannot verify existing immutable asset ${asset}" >&2; exit 1; }
  cmp -s "$directory/$asset" "$tmp/$asset" || { echo "immutable release ${tag} differs at ${asset}; refusing overwrite" >&2;exit 1;}
done
for index in 0 1;do
  asset="${deb}"; [[ "$index" == 1 ]] && asset="$record"
  [[ "${present[$index]}" == absent ]] || continue
  gh release upload "$tag" "$directory/$asset" --repo "$repo" || { echo "upload outcome uncertain for ${asset}; re-query required" >&2; exit 1; }
  gh release download "$tag" --repo "$repo" --pattern "$asset" --dir "$tmp" || { echo "upload outcome uncertain for ${asset}; re-query did not verify it" >&2; exit 1; }
  cmp -s "$directory/$asset" "$tmp/$asset" || { echo "uploaded immutable asset differs at ${asset}" >&2; exit 1; }
done
