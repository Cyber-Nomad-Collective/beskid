#!/usr/bin/env bash
# Validate the schema and immutable OCI references in a release manifest.
set -euo pipefail

[[ $# -eq 1 ]] || { echo "usage: $0 <manifest.json>" >&2; exit 2; }
manifest="$1"
[[ -f "${manifest}" ]] || { echo "manifest not found: ${manifest}" >&2; exit 1; }

jq -e '
  .schema_version == 1 and
  (.source.repository | type == "string" and length > 0) and
  (.source.commit | test("^[0-9a-f]{40}$")) and
  (.build.run_id | type == "string" and length > 0) and
  (.policy.sbom_required == true) and
  (.policy.provenance_required == true) and
  (.policy.vulnerability_scan_required == true) and
  (.policy.signature_required == true) and
  (.images | type == "array" and length > 0) and
  ([.images[].name] | length == (unique | length)) and
  ([.images[].repository] | length == (unique | length)) and
  all(.images[];
    (.name | type == "string" and length > 0) and
    (.repository | test("^[a-z0-9.-]+/[a-z0-9._/-]+$")) and
    (.digest | test("^sha256:[0-9a-f]{64}$")) and
    (.sbom == true) and
    (.provenance == true) and
    (.vulnerabilities == "passed") and
    (.signed == true)
  )
' "${manifest}" >/dev/null

echo "release manifest OK: ${manifest}"
