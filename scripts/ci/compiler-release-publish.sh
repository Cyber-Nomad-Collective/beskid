#!/usr/bin/env bash
# Publish CLI or LSP assets to Cyber-Nomad-Collective/beskid_compiler GitHub Releases.
# Env: RELEASE_STREAM (cli|lsp), RELEASE_VERSION, COMPILER_SHA, RELEASE_ASSETS_DIR
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

: "${RELEASE_STREAM:?RELEASE_STREAM is required (cli or lsp)}"
: "${RELEASE_VERSION:?RELEASE_VERSION is required}"
: "${COMPILER_SHA:?COMPILER_SHA is required}"

RELEASE_ASSETS_DIR="${RELEASE_ASSETS_DIR:-${ROOT}/release-assets}"

token="${COMPILER_RELEASE_TOKEN:-${COMPILER_SUBMODULE_TOKEN:-}}"
if [[ -z "${token}" ]]; then
  echo "Set COMPILER_RELEASE_TOKEN (or COMPILER_SUBMODULE_TOKEN) with contents:write on beskid_compiler." >&2
  exit 1
fi

export GH_TOKEN="${token}"
REPO="Cyber-Nomad-Collective/beskid_compiler"

case "${RELEASE_STREAM}" in
  cli)
    version_file="cli-version.txt"
    immutable_tag="cli-v${RELEASE_VERSION}"
    rolling_tag="cli-latest"
    immutable_name="Beskid CLI v${RELEASE_VERSION}"
    rolling_name="Beskid CLI (rolling)"
    asset_glob="beskid-*"
    ;;
  lsp)
    version_file="lsp-version.txt"
    immutable_tag="lsp-v${RELEASE_VERSION}"
    rolling_tag="lsp-latest"
    immutable_name="Beskid LSP v${RELEASE_VERSION}"
    rolling_name="Beskid LSP (rolling)"
    asset_glob="beskid_lsp-*"
    ;;
  *)
    echo "Unsupported RELEASE_STREAM: ${RELEASE_STREAM}" >&2
    exit 1
    ;;
esac

mkdir -p "${RELEASE_ASSETS_DIR}"
printf '%s\n' "${RELEASE_VERSION}" > "${RELEASE_ASSETS_DIR}/${version_file}"

mapfile -t assets < <(find "${RELEASE_ASSETS_DIR}" -type f \( -name "${version_file}" -o -name "${asset_glob}" \) | sort)
if [[ "${#assets[@]}" -lt 4 ]]; then
  echo "Expected version file plus platform assets under ${RELEASE_ASSETS_DIR} (got ${#assets[@]})" >&2
  ls -la "${RELEASE_ASSETS_DIR}" >&2 || true
  exit 1
fi

immutable_body="$(cat <<EOF
Immutable ${RELEASE_STREAM^^} release for version \`${RELEASE_VERSION}\`.

**Commit:** \`${COMPILER_SHA}\`

For the rolling build that tracks \`main\`, use the [${rolling_tag}](https://github.com/${REPO}/releases/tag/${rolling_tag}) release instead.
EOF
)"

rolling_body="$(cat <<EOF
Rolling ${RELEASE_STREAM^^} build.

**Version string:** \`${RELEASE_VERSION}\`
**Commit:** \`${COMPILER_SHA}\`
EOF
)"

if gh release view "${immutable_tag}" --repo "${REPO}" >/dev/null 2>&1; then
  echo "Immutable release ${immutable_tag} already exists; uploading assets without clobber"
  gh release upload "${immutable_tag}" --repo "${REPO}" "${assets[@]}"
else
  gh release create "${immutable_tag}" \
    --repo "${REPO}" \
    --target "${COMPILER_SHA}" \
    --title "${immutable_name}" \
    --notes "${immutable_body}" \
    "${assets[@]}"
fi

if gh release view "${rolling_tag}" --repo "${REPO}" >/dev/null 2>&1; then
  gh release upload "${rolling_tag}" --repo "${REPO}" "${assets[@]}" --clobber
else
  gh release create "${rolling_tag}" \
    --repo "${REPO}" \
    --target "${COMPILER_SHA}" \
    --title "${rolling_name}" \
    --notes "${rolling_body}" \
    "${assets[@]}"
fi

echo "compiler-release-publish: OK (${RELEASE_STREAM} ${RELEASE_VERSION} @ ${COMPILER_SHA})"
