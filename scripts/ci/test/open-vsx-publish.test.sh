#!/usr/bin/env bash
# Run the publisher with mocked toolchain commands to test duplicate handling.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
tmp="$(mktemp -d)"
trap 'rm -rf "${tmp}"' EXIT

mkdir -p "${tmp}/root/scripts/ci" "${tmp}/root/compiler" "${tmp}/root/beskid_vscode"
cp "${ROOT}/scripts/ci/open-vsx-publish.sh" "${tmp}/root/scripts/ci/"
cat >"${tmp}/root/beskid_vscode/package.json" <<'JSON'
{"name":"beskid-vscode","version":"0.0.1","publisher":"beskid","icon":"icon.png"}
JSON
touch "${tmp}/root/beskid_vscode/icon.png"
mkdir -p "${tmp}/bin"

cat >"${tmp}/bin/cargo" <<'SH'
#!/usr/bin/env bash
set -euo pipefail
mkdir -p target/release
touch target/release/beskid_lsp
SH
cat >"${tmp}/bin/bun" <<'SH'
#!/usr/bin/env bash
set -euo pipefail
exit 0
SH
cat >"${tmp}/bin/bunx" <<'SH'
#!/usr/bin/env bash
set -euo pipefail
case "$1" in
  ovsx)
    if [[ "$2" == create-namespace ]]; then exit 0; fi
    if [[ "$2" == publish ]]; then
      printf '%s\n' "${OVSX_PUBLISH_OUTPUT}"
      exit "${OVSX_PUBLISH_CODE}"
    fi
    ;;
  @vscode/vsce)
    for ((i = 1; i <= $#; i++)); do
      if [[ "${!i}" == --out ]]; then
        next=$((i + 1)); touch "${!next}"; exit 0
      fi
    done
    ;;
esac
exit 0
SH
chmod +x "${tmp}/bin/cargo" "${tmp}/bin/bun"
chmod +x "${tmp}/bin/bunx"

run_publish() {
	PATH="${tmp}/bin:${PATH}" \
	OVSX_TOKEN=test GITHUB_REF_TYPE=tag GITHUB_REF_NAME=v9.8.7 \
	OVSX_PUBLISH_OUTPUT="$1" OVSX_PUBLISH_CODE=1 \
	bash "${tmp}/root/scripts/ci/open-vsx-publish.sh" linux-x64 beskid_lsp
}

if run_publish 'Extension other.beskid-vscode with version 9.8.7 already exists'; then
	echo 'publisher accepted a duplicate response for a different extension' >&2
	exit 1
fi
if run_publish 'Extension beskid.beskid-vscode with version 9.8.6 already exists'; then
	echo 'publisher accepted a duplicate response for a different version' >&2
	exit 1
fi
run_publish 'Extension beskid.beskid-vscode with version 9.8.7 already exists'
[[ "$(node -p "require('${tmp}/root/beskid_vscode/package.json').version")" == 0.0.1 ]] || {
	echo 'publisher did not restore the extension version after packaging' >&2
	exit 1
}

echo 'Open VSX duplicate publish contract OK'
