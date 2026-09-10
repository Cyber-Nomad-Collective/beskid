#!/usr/bin/env bash
# Verify that the packaged BSOL grammar pin agrees with the staged gitlink and
# the initialized checkout. Using the index keeps this gate usable before the
# gitlink update is committed.
set -euo pipefail

root="${1:-$(cd "$(dirname "$0")/../.." && pwd)}"
manifest="${root}/editors/zed/extension.toml"
checkout="${root}/beskid_bsol"

fail() {
  printf 'FAIL: %s\n' "$1" >&2
  exit 1
}

[[ -f "${manifest}" ]] || fail "missing Zed extension manifest: ${manifest}"
[[ -e "${checkout}/.git" ]] || fail 'beskid_bsol submodule checkout is not initialized'

gitlink_mode="$(git -C "${root}" ls-files -s -- beskid_bsol | awk '{print $1}')"
[[ "${gitlink_mode}" == 160000 ]] || fail 'beskid_bsol is not staged as a submodule gitlink'

index_commit="$(git -C "${root}" rev-parse :beskid_bsol)"
checkout_commit="$(git -C "${checkout}" rev-parse HEAD)"
python_bin=python3
if ! "${python_bin}" -c 'import tomllib' >/dev/null 2>&1; then
  for candidate in /opt/homebrew/bin/python3 /usr/local/bin/python3; do
    if [[ -x "${candidate}" ]] && "${candidate}" -c 'import tomllib' >/dev/null 2>&1; then
      python_bin="${candidate}"
      break
    fi
  done
fi
"${python_bin}" -c 'import tomllib' >/dev/null 2>&1 || \
  fail 'Python 3.11 or newer is required for TOML validation'
manifest_commit="$("${python_bin}" - "${manifest}" <<'PY'
import pathlib
import sys
import tomllib

manifest = pathlib.Path(sys.argv[1])
with manifest.open("rb") as handle:
    data = tomllib.load(handle)
print(data["grammars"]["bsol"]["commit"])
PY
)"

[[ "${manifest_commit}" == "${index_commit}" ]] || \
  fail "Zed BSOL manifest pin ${manifest_commit} does not match staged gitlink ${index_commit}"
[[ "${checkout_commit}" == "${index_commit}" ]] || \
  fail "initialized beskid_bsol checkout ${checkout_commit} does not match staged gitlink ${index_commit}"

printf 'Zed BSOL gitlink contract OK (%s)\n' "${index_commit}"
