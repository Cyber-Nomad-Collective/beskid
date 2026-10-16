#!/usr/bin/env bash
# Windows repackage step (.woodpecker/repackage-windows.yml). A script for the reason given in
# woodpecker-build-windows.sh: long inline commands parse unreliably in the Windows agent's MSYS bash.
set -euo pipefail
export GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=core.autocrlf GIT_CONFIG_VALUE_0=false
imagemagick_dir='C:/ProgramData/Woodpecker/ImageMagick'
[ -x "${imagemagick_dir}/magick.exe" ] || { echo "ImageMagick is missing from the Windows agent" >&2; exit 1; }
export PATH="$(cygpath -u "${imagemagick_dir}"):${PATH}"
command -v node >/dev/null || { echo 'node is unavailable on the Windows agent' >&2; exit 1; }
bash scripts/ci/init-submodules.sh beskid_distrib
export BESKID_HANDOFF_SSH_KEY="C:/ProgramData/Woodpecker/handoff/windows.sftp"
export BESKID_HANDOFF_KNOWN_HOSTS="C:/ProgramData/Woodpecker/handoff/known_hosts"
bash scripts/ci/woodpecker-repackage-platform.sh windows "${BESKID_REPACKAGE_FROM:?set BESKID_REPACKAGE_FROM to the build pipeline}"
