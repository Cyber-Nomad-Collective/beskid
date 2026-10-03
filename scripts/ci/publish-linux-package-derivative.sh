#!/usr/bin/env bash
set -euo pipefail

intent="${1:?usage: publish-linux-package-derivative.sh <intent.json> <correction-dir>}"
directory="${2:?usage: publish-linux-package-derivative.sh <intent.json> <correction-dir>}"
repo="Cyber-Nomad-Collective/beskid_compiler"
scripts="$(cd "$(dirname "$0")" && pwd)"

[[ -n "${GH_TOKEN:-}" ]] || { echo 'GH_TOKEN must be exported only to this publisher process' >&2; exit 1; }
command -v gh >/dev/null || { echo 'GitHub CLI is required' >&2; exit 1; }

temp_base="$(realpath "${TMPDIR:-/tmp}")"
tmp="$(mktemp -d "$temp_base/beskid-linux-package-derivative.XXXXXX")"
chmod 700 "$tmp"
trap 'rm -rf -- "$tmp"' EXIT
snapshot_intent="$tmp/reviewed-intent.json"
snapshot_root="$tmp/prepared-output"

# The caller must invoke this external manual publisher from the reviewed,
# clean main checkout. Before the first remote query, freeze the already
# prepared correction into a private snapshot and make that snapshot the sole
# authority for all later comparisons and uploads.
metadata="$(node --input-type=module - "$scripts/linux-package-derivative.mjs" "$intent" "$directory" "$snapshot_intent" "$snapshot_root" <<'NODE'
import { pathToFileURL } from "node:url";
import { constants } from "node:fs";
import { chmodSync, copyFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
const [modulePath,intent,directory,snapshotIntent,snapshotRoot]=process.argv.slice(2);
const {ReadCorrectionIntent,ValidateCorrectionOutput}=await import(pathToFileURL(modulePath));
copyFileSync(intent,snapshotIntent,constants.COPYFILE_EXCL);
chmodSync(snapshotIntent,0o600);
const definition=ReadCorrectionIntent(snapshotIntent);
ValidateCorrectionOutput(snapshotIntent,directory);
mkdirSync(snapshotRoot,{mode:0o700});
chmodSync(snapshotRoot,0o700);
mkdirSync(join(snapshotRoot,"qualification"),{mode:0o700});
chmodSync(join(snapshotRoot,"qualification"),0o700);
for(const relativePath of [definition.artifact.name,definition.record.name,"correction-intent.json",`qualification/${definition.qualification.red.log}`,`qualification/${definition.qualification.green.log}`]){
  const destination=join(snapshotRoot,relativePath);
  copyFileSync(join(directory,relativePath),destination,constants.COPYFILE_EXCL);
  chmodSync(destination,0o600);
}
const result=ValidateCorrectionOutput(snapshotIntent,snapshotRoot);
for(const value of [result.tag,result.compiler,result.artifact,result.record,result.root])process.stdout.write(`${value}\n`);
NODE
)" || { echo 'local correction output is invalid' >&2; exit 1; }
tag="$(sed -n '1p' <<<"$metadata")"
compiler="$(sed -n '2p' <<<"$metadata")"
deb="$(sed -n '3p' <<<"$metadata")"
record="$(sed -n '4p' <<<"$metadata")"
root="$(sed -n '5p' <<<"$metadata")"
[[ -n "$tag" && -n "$compiler" && -n "$deb" && -n "$record" && -n "$root" && "$(sed -n '6p' <<<"$metadata")" == "" ]] || {
  echo 'local correction metadata is malformed' >&2
  exit 1
}

json_object_fields() {
  node -e 'const value=JSON.parse(process.argv[1]);const object=value?.object;if(!object||typeof object.type!=="string"||typeof object.sha!=="string")process.exit(1);console.log(object.type);console.log(object.sha)' "$1"
}

verify_immutable_tag() {
  local object fields type sha depth=0
  object="$(gh api "repos/${repo}/git/ref/tags/${tag}")" || {
    echo "immutable tag ${tag} is absent or unreadable" >&2
    return 1
  }
  while :; do
    fields="$(json_object_fields "$object")" || { echo "immutable tag ${tag} returned malformed data" >&2; return 1; }
    type="$(sed -n '1p' <<<"$fields")"
    sha="$(sed -n '2p' <<<"$fields")"
    [[ "$sha" =~ ^[0-9a-f]{40}$ ]] || { echo "immutable tag ${tag} returned an invalid object" >&2; return 1; }
    if [[ "$type" == commit ]]; then
      [[ "$sha" == "$compiler" ]] || { echo "immutable tag ${tag} does not resolve to reviewed compiler ${compiler}" >&2; return 1; }
      return 0
    fi
    [[ "$type" == tag && "$depth" -lt 8 ]] || { echo "immutable tag ${tag} has an unsupported object chain" >&2; return 1; }
    depth=$((depth + 1))
    object="$(gh api "repos/${repo}/git/tags/${sha}")" || { echo "immutable tag ${tag} object is unreadable" >&2; return 1; }
  done
}

release_inventory() {
  gh release view "$tag" --repo "$repo" --json assets || {
    echo "immutable release ${tag} is absent or unreadable" >&2
    return 1
  }
}

asset_state() {
  node -e 'const view=JSON.parse(process.argv[1]),name=process.argv[2];if(!view||!Array.isArray(view.assets))process.exit(2);const count=view.assets.filter(asset=>asset&&asset.name===name).length;if(count>1)process.exit(3);console.log(count===1?"present":"absent")' "$1" "$2"
}

download_sequence=0
verify_remote_asset() {
  local name="$1" destination
  download_sequence=$((download_sequence + 1))
  destination="$tmp/download-${download_sequence}"
  mkdir "$destination"
  gh release download "$tag" --repo "$repo" --pattern "$name" --dir "$destination" || {
    echo "cannot verify existing immutable asset ${name}" >&2
    return 1
  }
  cmp -s "$root/$name" "$destination/$name" || {
    echo "immutable release ${tag} differs at ${name}; refusing overwrite" >&2
    return 1
  }
}

verify_immutable_tag
inventory="$(release_inventory)"
deb_state="$(asset_state "$inventory" "$deb")" || { echo "immutable release inventory is ambiguous or malformed for ${deb}" >&2; exit 1; }
record_state="$(asset_state "$inventory" "$record")" || { echo "immutable release inventory is ambiguous or malformed for ${record}" >&2; exit 1; }

# Preflight all existing bytes before the first write. In particular, an exact
# absent DEB never masks a mismatched existing correction record.
[[ "$deb_state" != present ]] || verify_remote_asset "$deb"
[[ "$record_state" != present ]] || verify_remote_asset "$record"

for asset in "$deb" "$record"; do
  # A concurrent change or a retry after an uncertain prior attempt is resolved
  # from fresh remote state. Never blindly retry or overwrite a name.
  verify_immutable_tag
  inventory="$(release_inventory)" || exit 1
  state="$(asset_state "$inventory" "$asset")" || { echo "immutable release inventory is ambiguous or malformed for ${asset}" >&2; exit 1; }
  if [[ "$state" == present ]]; then
    verify_remote_asset "$asset"
    continue
  fi

  set +e
  gh release upload "$tag" "$root/$asset" --repo "$repo"
  upload_status=$?
  set -e

  # Upload failures are outcome-uncertain. Re-query once and accept only an
  # exact public asset; verified absence is a stopped partial attempt.
  inventory="$(release_inventory)" || {
    echo "upload outcome uncertain for ${asset}; remote state could not be re-queried" >&2
    exit 1
  }
  state="$(asset_state "$inventory" "$asset")" || { echo "post-upload inventory is ambiguous or malformed for ${asset}" >&2; exit 1; }
  if [[ "$state" == absent ]]; then
    if [[ "$upload_status" -eq 0 ]]; then echo "upload reported success but ${asset} remains absent" >&2
    else echo "upload failed and ${asset} remains absent; retry requires a fresh full preflight" >&2; fi
    exit 1
  fi
  verify_remote_asset "$asset"
done
