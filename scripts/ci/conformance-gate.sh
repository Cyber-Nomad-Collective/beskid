#!/usr/bin/env bash
# Verify every OpenSpec requirement has provenance and conformance metadata.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "${ROOT}"

pnpm run openspec:validate

jq -e '
  ((.schemaVersion == 1) or (.schema_version == 1)) and
  .authority == "openspec/specs" and
  (.entries | type == "array" and length > 0) and
  (.stats.capabilities > 0) and
  (.stats.requirements > 0) and
  (.stats.nodes >= .stats.requirements)
' openspec/catalog.json >/dev/null

if rg -n --glob '*.md' '^#{1,6}[[:space:]]+(Normative|Requirements?)$' \
  site/website/src/content docs README.md 2>/dev/null; then
  echo "informative documentation contains a normative authority heading" >&2
  exit 1
fi

if sed -n '/^  platform-spec:/,/^  tracker:/p' \
  beskid_infra/compose/production/docker-compose.yml | rg -n \
  'SPEC_GIT_(REPO_URL|REF|CONTENT_PATH)|SPEC_SYNC_MODE|beskid_normative_spec'; then
  echo "platform-spec deployment retains retired custom authority or GitHub synchronization configuration" >&2
  exit 1
fi

echo "OpenSpec conformance provenance OK"
