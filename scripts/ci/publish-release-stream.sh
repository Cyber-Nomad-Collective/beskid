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
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

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
node "$(dirname "$0")/release-version.mjs" "${RELEASE_VERSION}" >/dev/null
jq -e --arg version "${RELEASE_VERSION}" --arg compiler "${COMPILER_SHA}" --arg channel "${RELEASE_CHANNEL}" '
  .schema_version == 1 and .publishable == true and
  .version == $version and .channel == $channel and
  .provenance.compiler_commit == $compiler and
  ($compiler | test("^[0-9a-f]{40}$")) and
  (.provenance.superrepo_commit | test("^[0-9a-f]{40}$")) and
  (if $channel == "stable" then .tests.gate_result == "success" and
    (.tests.failed | length) == 0 else true end)
' "${RELEASE_STATE}" >/dev/null || {
  echo 'publication arguments do not match qualified release-state evidence' >&2
  exit 1
}

notes_file="$(mktemp)"
immutable_check=""
rolling_check=""
trap 'rm -f "${notes_file}"; [[ -z "${immutable_check}" ]] || rm -rf "${immutable_check}"; [[ -z "${rolling_check}" ]] || rm -rf "${rolling_check}"' EXIT
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

verify_immutable_tag() {
  local object type sha depth=0
  object="$(gh api "repos/${REPO}/git/ref/tags/${immutable_tag}")"
  while :; do
    type="$(jq -r '.object.type' <<<"${object}")"
    sha="$(jq -r '.object.sha' <<<"${object}")"
    [[ "${sha}" =~ ^[0-9a-f]{40}$ ]] || { echo 'invalid immutable tag object' >&2; return 1; }
    if [[ "${type}" == commit ]]; then
      [[ "${sha}" == "${COMPILER_SHA}" ]] || {
        echo "immutable tag does not resolve to compiler ${COMPILER_SHA}" >&2
        return 1
      }
      return 0
    fi
    [[ "${type}" == tag && "${depth}" -lt 8 ]] || { echo 'unsupported immutable tag object chain' >&2; return 1; }
    depth=$((depth + 1))
    object="$(gh api "repos/${REPO}/git/tags/${sha}")"
  done
}

# Immutable tag: create if missing, then upload assets. This always happens
# before the caller can advance rolling aliases.
if [[ "$PHASE" == "immutable" || "$PHASE" == "both" ]]; then
  if gh release view "$immutable_tag" --repo "$REPO" >/dev/null 2>&1; then
    verify_immutable_tag
    # Distribution owns additional installer assets on the CLI release. Their
    # presence must not prevent a compiler-stream retry, but unknown assets do.
    allowed_assets=("${assets[@]}" SHA256SUMS)
    if [[ "${STREAM}" == cli ]]; then
      allowed_assets+=("beskid-${RELEASE_VERSION}-windows-amd64.msi"
        "beskid-${RELEASE_VERSION}-windows-amd64.exe"
        "beskid-${RELEASE_VERSION}-macos-arm64.dmg"
        "beskid-${RELEASE_VERSION}-amd64.deb" beskid.rb distrib-version.txt)
    fi
    remote_assets="$(gh release view "$immutable_tag" --repo "$REPO" --json assets --jq '.assets[].name')"
    while IFS= read -r remote_asset; do
      printf '%s\n' "${allowed_assets[@]}" | grep -Fxq -- "${remote_asset}" || {
        echo "unexpected immutable release asset: ${remote_asset}" >&2
        exit 1
      }
    done <<<"${remote_assets}"
    immutable_check="$(mktemp -d)"
    for asset in "${assets[@]}"; do
      gh release download "$immutable_tag" --repo "$REPO" --pattern "$asset" --dir "${immutable_check}"
      cmp -s "$asset" "${immutable_check}/${asset}" || {
        echo "immutable release ${immutable_tag} differs at ${asset}; refusing overwrite" >&2
        exit 1
      }
    done
    echo "Immutable release ${immutable_tag} already matches; no mutation."
  else
    gh release create "$immutable_tag" --repo "$REPO" --target "$COMPILER_SHA" \
      --title "$immutable_title" --notes-file "${notes_file}" "${assets[@]}"
  fi
fi

# Rolling tag: create if missing, then upload (clobber so the rolling build
# always reflects the latest main).
if [[ "$PHASE" == "rolling" || "$PHASE" == "both" ]]; then
  if gh release view "$rolling_tag" --repo "$REPO" >/dev/null 2>&1; then
    if [[ "${RELEASE_CHANNEL}" == stable ]]; then
      rolling_check="$(mktemp -d)"
      gh release download "$rolling_tag" --repo "$REPO" --pattern release-state.json --dir "${rolling_check}"
      jq -e '.schema_version == 1 and .channel == "stable" and .publishable == true' "${rolling_check}/release-state.json" >/dev/null
      previous_version="$(jq -r '.version' "${rolling_check}/release-state.json")"
      ordering="$(node "${SCRIPT_DIR}/release-version.mjs" --compare-stable "${RELEASE_VERSION}" "${previous_version}")"
      [[ "${ordering}" != -1 ]] || { echo "refusing stable downgrade from ${previous_version} to ${RELEASE_VERSION}" >&2; exit 1; }
      if [[ "${ordering}" == 0 ]]; then
        previous_compiler="$(jq -r '.provenance.compiler_commit' "${rolling_check}/release-state.json")"
        [[ "${previous_compiler}" == "${COMPILER_SHA}" ]] || { echo 'same stable version refers to another compiler commit' >&2; exit 1; }
      fi
    fi
    # Uploading replacement assets does not move the tag; retarget it so the
    # rolling release metadata and assets describe the same compiler build.
    gh release edit "$rolling_tag" --repo "$REPO" --target "$COMPILER_SHA" --notes-file "${notes_file}"
    gh release upload "$rolling_tag" --repo "$REPO" "${assets[@]}" --clobber
    # Editing release metadata alone does not retarget an existing Git tag.
    gh api --method PATCH "repos/${REPO}/git/refs/tags/${rolling_tag}" \
      -f "sha=${COMPILER_SHA}" -F force=true >/dev/null
  else
    gh release create "$rolling_tag" --repo "$REPO" --target "$COMPILER_SHA" \
      --title "$rolling_title" --notes-file "${notes_file}" "${assets[@]}"
  fi
fi

echo "compiler-release-publish: OK (${STREAM} ${RELEASE_VERSION} @ ${COMPILER_SHA})"
