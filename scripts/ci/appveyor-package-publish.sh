#!/usr/bin/env bash
# Rehearse package publication on every platform build; mutate only on trusted main.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
MODE="${1:-}"

# shellcheck source-path=SCRIPTDIR
# shellcheck source=lib/appveyor-event-policy.sh
source "${ROOT}/scripts/ci/lib/appveyor-event-policy.sh"

cd "${ROOT}"
case "${MODE}" in
  rehearse)
    bash scripts/ci/corelib-publish.sh patch --dry-run
    ;;
  publish)
    if ! appveyor_is_trusted_main_push; then
      echo "Corelib/template package publication is disabled for this AppVeyor event."
      exit 0
    fi
    if [[ -z "${BESKID_PCKG_API_KEY:-}" ]]; then
      echo "BESKID_PCKG_API_KEY is required for trusted main package publication" >&2
      exit 3
    fi
    BESKID_PCKG_BASE_URL=https://pckg.beskid-lang.org \
      bash scripts/ci/corelib-publish.sh patch
    ;;
  *)
    echo "Usage: $0 <rehearse|publish>" >&2
    exit 2
    ;;
esac
