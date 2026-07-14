#!/usr/bin/env bash
# Compatibility entry point for callers that still use the CLI-specific name.
set -euo pipefail

exec "$(dirname "$0")/resolve-beskid-version.sh" "$@"
