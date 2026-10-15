#!/usr/bin/env bash
# Repackage one platform from the retained, qualified outputs of an earlier build pipeline.
#
# Usage: woodpecker-repackage-platform.sh <linux|macos|windows> <build-pipeline>
#
# Runs in a manual pipeline (BESKID_TASK=package-<platform>, BESKID_REPACKAGE_FROM=<build-pipeline>)
# from a root commit that differs from the build source only in packaging inputs. Nothing is rebuilt
# and no release case reruns: lib/repackage.mjs verifies the build's own checksums, results, release
# cases and gates and writes a fresh handoff directory beside the build output; the native installers
# are packaged from the build's bundle; and the handoff is uploaded under the build's identity
# (`/incoming/<build>-<source>/<platform>`, UPLOAD_COMPLETE pipeline=<build>) with packaged_by and
# packaged_by_commit naming this pipeline and its root commit.
#
# BESKID_REPACKAGE_OUTPUT_ROOT (tests and local validation only, forbidden in Woodpecker) replaces the
# platform output root; BESKID_REPACKAGE_SKIP_UPLOAD=1 (same restriction) stops before the upload.
set -euo pipefail
[[ "$#" == 2 ]] || { echo 'usage: woodpecker-repackage-platform.sh <linux|macos|windows> <build-pipeline>' >&2; exit 2; }
platform="$1"; build="$2"
root="$(cd "$(dirname "$0")/../.." && pwd)"
# Woodpecker's git plugin clones with --depth=1 even when depth: 0 is set; the provenance checks
# below walk ancestry from this commit to the build source, so they need full history.
if [[ "$(git -C "$root" rev-parse --is-shallow-repository)" == true ]]; then
  git -C "$root" fetch --quiet --unshallow --no-tags origin
fi
[[ "$build" =~ ^[1-9][0-9]*$ ]] || { echo 'build pipeline must be a positive number' >&2; exit 2; }
[[ "${CI_PIPELINE_EVENT:-}" == manual && "${CI_PIPELINE_NUMBER:-}" =~ ^[1-9][0-9]*$ ]] || {
  echo 'repackaging runs only in a manual pipeline' >&2; exit 1;
}
pipeline="${CI_PIPELINE_NUMBER}"
[[ "$pipeline" != "$build" ]] || { echo 'a pipeline cannot repackage itself' >&2; exit 1; }
if [[ -n "${BESKID_REPACKAGE_OUTPUT_ROOT:-}${BESKID_REPACKAGE_SKIP_UPLOAD:-}" && "${CI_SYSTEM_NAME:-}" == woodpecker ]]; then
  echo 'BESKID_REPACKAGE_OUTPUT_ROOT and BESKID_REPACKAGE_SKIP_UPLOAD are forbidden in Woodpecker' >&2; exit 2
fi
case "$platform" in
  linux) output_root=/woodpecker-output ;;
  windows) output_root=C:/woodpecker-output/beskid ;;
  macos) output_root="${HOME}/Library/Application Support/Woodpecker/beskid-output" ;;
  *) echo 'unsupported platform' >&2; exit 2 ;;
esac
output_root="${BESKID_REPACKAGE_OUTPUT_ROOT:-$output_root}"
[[ "$(git -C "$root" rev-parse HEAD)" == "${CI_COMMIT_SHA:-}" ]] || { echo 'checkout is not this pipeline commit' >&2; exit 1; }

verified="$(node "$root/scripts/ci/lib/repackage.mjs" verify "$output_root" "$platform" "$build" "$pipeline")"
field() { node -e 'process.stdout.write(String(JSON.parse(process.argv[1])[process.argv[2]]))' "$verified" "$1"; }
evidence_root="$(field evidence_root)"; handoff="$(field handoff)"
source="$(field source)"; compiler="$(field compiler)"; version="$(field version)"
echo "repackaging ${platform} build ${build} (source ${source}) in pipeline ${pipeline}"

package_output="${handoff}-package"
node "$root/scripts/ci/woodpecker-package-platform.mjs" "$platform" "$evidence_root" "$package_output" --repackage "$build" "$pipeline"
node -e 'const fs=require("fs"),p=process.argv[1],o=process.argv[2],r=JSON.parse(fs.readFileSync(p+"/package-result.json")); for(const a of r.artifacts) fs.copyFileSync(p+"/"+a.name,o+"/"+a.name); fs.copyFileSync(p+"/package-result.json",o+"/package-result.json")' "$package_output" "$handoff"

if [[ "${BESKID_REPACKAGE_SKIP_UPLOAD:-0}" == 1 ]]; then
  echo "repackaged handoff prepared without upload: ${handoff}"
  exit 0
fi
bash "$root/scripts/ci/woodpecker-upload-handoff.sh" "$platform" "$handoff" "$source" "$compiler" "$version" "$build" --repackaged-by "$pipeline"
echo "repackaged handoff uploaded: /incoming/${build}-${source}/${platform} (packaged by pipeline ${pipeline})"
