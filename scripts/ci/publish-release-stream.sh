#!/usr/bin/env bash
# Publish a CLI, LSP, or direct-install bundle release stream to beskid_compiler
# GitHub releases.
#
# For the given stream, uploads the
# assets to both an immutable tag (cli-v<version> / lsp-v<version>) and a
# rolling tag (cli-stable / lsp-stable, default) or a provided release channel,
# exist. Operates on a directory of assets produced by build-release-artifact.sh.
#
# Usage: publish-release-stream.sh <stream> <release-version> <compiler-sha> <assets-dir> [phase] [release-channel] [release-state]
#   stream           cli | lsp | bundle
#   release-version  resolved semver
#   compiler-sha     compiler submodule HEAD the release was built from
#   assets-dir       directory containing the built assets (+ version file)
#   phase            immutable | rolling | both (default: both)
#   release-channel  stable (default) | unstable
# Env: GH_TOKEN (github token with contents:write on beskid_compiler)
set -euo pipefail

STREAM="${1:?stream (cli | lsp)}"
RELEASE_VERSION="${2:?release-version}"
COMPILER_SHA="${3:?compiler-sha}"
ASSETS_DIR="${4:?assets-dir}"
PHASE="${5:-both}"
RELEASE_CHANNEL="${6:-stable}"
RELEASE_STATE="${7:-}"

REPO="Cyber-Nomad-Collective/beskid_compiler"

case "$RELEASE_CHANNEL" in
  stable|unstable) ;;
  *) echo "Unsupported release channel: $RELEASE_CHANNEL" >&2; exit 1 ;;
esac

case "$STREAM" in
  cli)
    version_file="cli-version.txt"
    immutable_tag="cli-v${RELEASE_VERSION}"
    case "$RELEASE_CHANNEL" in
      stable) rolling_tag="cli-stable" ;;
      unstable) rolling_tag="cli-unstable" ;;
    esac
    immutable_title="Beskid CLI v${RELEASE_VERSION}"
    rolling_title="Beskid CLI (${RELEASE_CHANNEL} rolling)"
    asset_patterns=(beskid-linux-amd64 beskid-darwin-arm64 beskid-windows-amd64.exe)
    ;;
  lsp)
    version_file="lsp-version.txt"
    immutable_tag="lsp-v${RELEASE_VERSION}"
    case "$RELEASE_CHANNEL" in
      stable) rolling_tag="lsp-stable" ;;
      unstable) rolling_tag="lsp-unstable" ;;
    esac
    immutable_title="Beskid LSP v${RELEASE_VERSION}"
    rolling_title="Beskid LSP (${RELEASE_CHANNEL} rolling)"
    asset_patterns=(beskid_lsp-*)
    ;;
  bundle)
    version_file="bundle-version.txt"
    immutable_tag="v${RELEASE_VERSION}"
    rolling_tag="${RELEASE_CHANNEL}"
    immutable_title="Beskid v${RELEASE_VERSION}"
    rolling_title="Beskid (${RELEASE_CHANNEL} rolling)"
    asset_patterns=(beskid-*.tar.gz beskid-release.json)
    ;;
  *) echo "Unsupported release stream: $STREAM" >&2; exit 1 ;;
esac

case "$PHASE" in
  immutable|rolling|both) ;;
  *) echo "Unsupported publish phase: $PHASE" >&2; exit 1 ;;
esac

: "${GH_TOKEN:?GH_TOKEN must be exported (contents:write on ${REPO})}"

[[ -n "${RELEASE_STATE}" && -f "${RELEASE_STATE}" ]] || {
  echo 'release-state.json is required for publication' >&2
  exit 1
}
RELEASE_STATE="$(cd "$(dirname "${RELEASE_STATE}")" && pwd)/$(basename "${RELEASE_STATE}")"

notes_file="$(mktemp)"
trap 'rm -f "${notes_file}"' EXIT
bash "$(dirname "$0")/render-compiler-release-notes.sh" "${RELEASE_STATE}" "${STREAM}" >"${notes_file}"

cd "$ASSETS_DIR"
printf '%s\n' "$RELEASE_VERSION" > "$version_file"
if [[ "${RELEASE_STATE}" != "$(pwd)/release-state.json" ]]; then
  cp "${RELEASE_STATE}" release-state.json
fi

shopt -s nullglob
assets=()
for pattern in "${asset_patterns[@]}"; do
  for asset in ${pattern}; do assets+=("${asset}"); done
done
[[ "${#assets[@]}" -gt 0 ]] || {
  echo "no ${STREAM} assets are available for publication" >&2
  exit 1
}
# release-state.json is the machine-readable authority. Keep the small stream
# version file as a compatibility projection for the public installers.
assets+=("${version_file}" release-state.json)

# Immutable tag: create if missing, then upload assets. This always happens
# before the caller can advance rolling aliases.
if [[ "$PHASE" == "immutable" || "$PHASE" == "both" ]]; then
  if gh release view "$immutable_tag" --repo "$REPO" >/dev/null 2>&1; then
    gh release edit "$immutable_tag" --repo "$REPO" --notes-file "${notes_file}"
    gh release upload "$immutable_tag" --repo "$REPO" "${assets[@]}" --clobber
  else
    gh release create "$immutable_tag" --repo "$REPO" --target "$COMPILER_SHA" \
      --title "$immutable_title" --notes-file "${notes_file}" "${assets[@]}"
  fi
fi

# Rolling tag: create if missing, then upload (clobber so the rolling build
# always reflects the latest main).
if [[ "$PHASE" == "rolling" || "$PHASE" == "both" ]]; then
  if gh release view "$rolling_tag" --repo "$REPO" >/dev/null 2>&1; then
    # Uploading replacement assets does not move the tag; retarget it so the
    # rolling release metadata and assets describe the same compiler build.
    gh release edit "$rolling_tag" --repo "$REPO" --target "$COMPILER_SHA" --notes-file "${notes_file}"
    gh release upload "$rolling_tag" --repo "$REPO" "${assets[@]}" --clobber
  else
    gh release create "$rolling_tag" --repo "$REPO" --target "$COMPILER_SHA" \
      --title "$rolling_title" --notes-file "${notes_file}" "${assets[@]}"
  fi
fi

echo "compiler-release-publish: OK (${STREAM} ${RELEASE_VERSION} @ ${COMPILER_SHA})"
