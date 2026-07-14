#!/usr/bin/env bash
# Publish a CLI or LSP release stream to beskid_compiler GitHub releases.
#
# For the given stream, uploads the
# assets to both an immutable tag (cli-v<version> / lsp-v<version>) and a
# rolling tag (cli-latest / lsp-latest), creating the release if it doesn't
# exist. Operates on a directory of assets produced by build-release-artifact.sh.
#
# Usage: publish-release-stream.sh <stream> <release-version> <compiler-sha> <assets-dir>
#   stream           cli | lsp
#   release-version  resolved semver
#   compiler-sha     compiler submodule HEAD the release was built from
#   assets-dir       directory containing the built assets (+ version file)
# Env: GH_TOKEN (github token with contents:write on beskid_compiler)
set -euo pipefail

STREAM="${1:?stream (cli | lsp)}"
RELEASE_VERSION="${2:?release-version}"
COMPILER_SHA="${3:?compiler-sha}"
ASSETS_DIR="${4:?assets-dir}"

REPO="Cyber-Nomad-Collective/beskid_compiler"

case "$STREAM" in
  cli)
    version_file="cli-version.txt"
    immutable_tag="cli-v${RELEASE_VERSION}"
    rolling_tag="cli-latest"
    immutable_title="Beskid CLI v${RELEASE_VERSION}"
    rolling_title="Beskid CLI (rolling)"
    asset_glob="beskid-*"
    ;;
  lsp)
    version_file="lsp-version.txt"
    immutable_tag="lsp-v${RELEASE_VERSION}"
    rolling_tag="lsp-latest"
    immutable_title="Beskid LSP v${RELEASE_VERSION}"
    rolling_title="Beskid LSP (rolling)"
    asset_glob="beskid_lsp-*"
    ;;
  *) echo "Unsupported release stream: $STREAM" >&2; exit 1 ;;
esac

: "${GH_TOKEN:?GH_TOKEN must be exported (contents:write on ${REPO})}"

immutable_body="Immutable ${STREAM^^} release for version \`${RELEASE_VERSION}\`.

**Commit:** \`${COMPILER_SHA}\`

For the rolling build that tracks \`main\`, use the [${rolling_tag}](https://github.com/${REPO}/releases/tag/${rolling_tag}) release instead."

rolling_body="Rolling ${STREAM^^} build.

**Version string:** \`${RELEASE_VERSION}\`
**Commit:** \`${COMPILER_SHA}\`"

cd "$ASSETS_DIR"
printf '%s\n' "$RELEASE_VERSION" > "$version_file"

# Immutable tag: create if missing, then upload assets.
if gh release view "$immutable_tag" --repo "$REPO" >/dev/null 2>&1; then
  gh release upload "$immutable_tag" --repo "$REPO" $asset_glob
else
  gh release create "$immutable_tag" --repo "$REPO" --target "$COMPILER_SHA" \
    --title "$immutable_title" --notes "$immutable_body" $asset_glob
fi

# Rolling tag: create if missing, then upload (clobber so the rolling build
# always reflects the latest main).
if gh release view "$rolling_tag" --repo "$REPO" >/dev/null 2>&1; then
  gh release upload "$rolling_tag" --repo "$REPO" $asset_glob --clobber
else
  gh release create "$rolling_tag" --repo "$REPO" --target "$COMPILER_SHA" \
    --title "$rolling_title" --notes "$rolling_body" $asset_glob
fi

echo "compiler-release-publish: OK (${STREAM} ${RELEASE_VERSION} @ ${COMPILER_SHA})"
