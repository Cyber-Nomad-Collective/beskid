#!/usr/bin/env bash
# Publish a CLI, LSP, or direct-install bundle release stream to beskid_compiler
# GitHub releases.
#
# For the given stream, uploads the
# assets to both an immutable tag (cli-v<version> / lsp-v<version>) and a
# rolling tag (cli-stable / lsp-stable, default) or a provided release channel,
# exist. Operates on a directory of assets produced by build-release-artifact.sh.
#
# Usage: publish-release-stream.sh <stream> <release-version> <compiler-sha> <assets-dir> [phase] [release-channel]
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
    asset_glob="beskid-linux-amd64 beskid-darwin-arm64 beskid-windows-amd64.exe"
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
    asset_glob="beskid_lsp-*"
    ;;
  bundle)
    version_file="bundle-version.txt"
    immutable_tag="v${RELEASE_VERSION}"
    rolling_tag="${RELEASE_CHANNEL}"
    immutable_title="Beskid v${RELEASE_VERSION}"
    rolling_title="Beskid (${RELEASE_CHANNEL} rolling)"
    asset_glob="beskid-*.tar.gz beskid-release.json"
    ;;
  *) echo "Unsupported release stream: $STREAM" >&2; exit 1 ;;
esac

case "$PHASE" in
  immutable|rolling|both) ;;
  *) echo "Unsupported publish phase: $PHASE" >&2; exit 1 ;;
esac

: "${GH_TOKEN:?GH_TOKEN must be exported (contents:write on ${REPO})}"

stream_upper="$(printf '%s' "$STREAM" | tr '[:lower:]' '[:upper:]')"

immutable_body="Immutable ${stream_upper} release for version \`${RELEASE_VERSION}\`.

**Commit:** \`${COMPILER_SHA}\`

For the rolling build that tracks \`main\`, use the [${rolling_tag}](https://github.com/${REPO}/releases/tag/${rolling_tag}) release instead."

rolling_body="Rolling ${stream_upper} build.

**Version string:** \`${RELEASE_VERSION}\`
**Commit:** \`${COMPILER_SHA}\`"

cd "$ASSETS_DIR"
printf '%s\n' "$RELEASE_VERSION" > "$version_file"

# Immutable tag: create if missing, then upload assets. This always happens
# before the caller can advance rolling aliases.
if [[ "$PHASE" == "immutable" || "$PHASE" == "both" ]]; then
  if gh release view "$immutable_tag" --repo "$REPO" >/dev/null 2>&1; then
    gh release upload "$immutable_tag" --repo "$REPO" $asset_glob
  else
    gh release create "$immutable_tag" --repo "$REPO" --target "$COMPILER_SHA" \
      --title "$immutable_title" --notes "$immutable_body" $asset_glob
  fi
fi

# Rolling tag: create if missing, then upload (clobber so the rolling build
# always reflects the latest main).
if [[ "$PHASE" == "rolling" || "$PHASE" == "both" ]]; then
  if gh release view "$rolling_tag" --repo "$REPO" >/dev/null 2>&1; then
    gh release upload "$rolling_tag" --repo "$REPO" $asset_glob --clobber
  else
    gh release create "$rolling_tag" --repo "$REPO" --target "$COMPILER_SHA" \
      --title "$rolling_title" --notes "$rolling_body" $asset_glob
  fi
fi

echo "compiler-release-publish: OK (${STREAM} ${RELEASE_VERSION} @ ${COMPILER_SHA})"
