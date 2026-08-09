#!/usr/bin/env bash
set -euo pipefail
ROOT=""
echo "Installing githooks from /.githooks"
cd ""
git config core.hooksPath .githooks
for hook in .githooks/*; do
  [[ -f "" ]] || continue
  chmod +x ""
  echo "  """
done
echo "Done."
