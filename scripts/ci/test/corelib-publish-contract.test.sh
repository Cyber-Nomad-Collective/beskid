#!/usr/bin/env bash
# Contract for fail-closed corelib + template package publication.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
# shellcheck source=lib/assert.sh
source "${ROOT}/scripts/ci/test/lib/assert.sh"

GATE_WORKFLOW="$(cat "${ROOT}/.github/workflows/corelib.yml")"
DELIVERY_WORKFLOW="$(cat "${ROOT}/.github/workflows/platform-delivery.yml")"
RUNNER="$(cat "${ROOT}/scripts/ci/lib/corelib-publish-runner.mjs")"
PUBLISHER="$(cat "${ROOT}/scripts/ci/corelib-publish.sh")"

assert_contains "${GATE_WORKFLOW}" 'workflow_call:' \
  "the corelib gate is reusable by canonical platform delivery"
assert_contains "${DELIVERY_WORKFLOW}" "- 'beskid_templates'" \
  "template pointer changes trigger platform delivery checks"
assert_contains "${DELIVERY_WORKFLOW}" 'needs: [corelib, openspec, conformance' \
  "the release manifest requires the real corelib gate"
assert_contains "${DELIVERY_WORKFLOW}" 'needs: production' \
  "package publication waits for protected production promotion"
assert_contains "${DELIVERY_WORKFLOW}" 'corelib-publish.sh patch --dry-run' \
  "delivery rehearses all package artifacts before live publication"
assert_contains "${DELIVERY_WORKFLOW}" 'init-submodules.sh beskid_templates' \
  "the publication job initializes the templates submodule"
assert_contains "${DELIVERY_WORKFLOW}" 'BESKID_PCKG_BASE_URL: https://pckg.beskid-lang.org' \
  "publication targets the public Rust registry route"
assert_eq "absent" "$({ grep -Fq 'BESKID_PCKG_BASE_URL: https://pckg.beskid-lang.org:8082' <<<"${DELIVERY_WORKFLOW}" && echo present; } || echo absent)" \
  "publication does not mistake Coolify's target-port selector for a public TLS listener"
assert_eq "absent" "$({ grep -Fq "github.event_name != 'workflow_dispatch' || !inputs.unstable" <<<"${DELIVERY_WORKFLOW}" && echo present; } || echo absent)" \
  "unstable channel selection cannot skip release quality gates"
assert_contains "${RUNNER}" '"interop"' \
  "the interop package is part of the production corelib inventory"
assert_contains "${RUNNER}" '"glue"' \
  "the glue package is part of the production corelib inventory"
assert_contains "${RUNNER}" '"fiber_demo"' \
  "all first-party templates are part of the publication inventory"
assert_contains "${RUNNER}" 'EXCLUDED_CORELIB_MEMBERS' \
  "development and test-only corelib members are explicitly excluded"
assert_contains "${RUNNER}" 'Authorization: `Bearer ${token}`' \
  "publication uses the canonical bearer-key transport"
assert_contains "${RUNNER}" 'health/ready' \
  "registry readiness is checked before mutation"
assert_contains "${RUNNER}" '["pckg", "upload", meta.registryName, "--artifact", meta.artifact]' \
  "publication delegates artifact upload to the canonical compiler client"
assert_contains "${RUNNER}" 'source: "registry"' \
  "publication plans exact registry dependencies for the canonical compiler packer"
assert_contains "${RUNNER}" 'installed artifact retains a non-registry dependency source' \
  "publication rejects artifacts that retain source-workspace dependency paths"
assert_contains "${RUNNER}" 'template summary does not match template.json' \
  "publication validates template metadata agreement before registry mutation"
assert_contains "${RUNNER}" 'BESKID_PCKG_URL: baseUrl.href' \
  "the canonical compiler client receives the selected registry endpoint"
assert_contains "${RUNNER}" 'beskid_compiler/tree/main/corelib' \
  "corelib package metadata links to the compiler repository's real corelib root"
assert_contains "${PUBLISHER}" 'BESKID_PUBLISH_DRY_RUN' \
  "the publisher exposes a no-secret, no-mutation validation mode"
assert_contains "${PUBLISHER}" 'https://pckg.beskid-lang.org' \
  "the publisher default uses the canonical public registry URL"
assert_eq "absent" "$({ grep -Fq 'https://pckg.beskid-lang.org:8082' <<<"${PUBLISHER}" && echo present; } || echo absent)" \
  "the publisher default does not require an unavailable public custom-port listener"

assert_eq "absent" "$({ grep -Fq 'api/workspaces/publish' <<<"${RUNNER}" && echo present; } || echo absent)" \
  "legacy workspace-bundle publication is removed"
assert_eq "absent" "$({ grep -Fq 'X-API-Key' <<<"${RUNNER}" && echo present; } || echo absent)" \
  "legacy X-API-Key authentication is removed"
assert_eq "absent" "$({ grep -Fq 'new FormData' <<<"${RUNNER}" && echo present; } || echo absent)" \
  "the release publisher does not duplicate the compiler client's multipart upload"
assert_eq "absent" "$({ grep -Fq 'beskid_compiler/tree/main/compiler/corelib' <<<"${RUNNER}" && echo present; } || echo absent)" \
  "corelib metadata does not retain the dead nested compiler path"

JS_RUNTIME="$(command -v node || command -v bun || true)"
if [[ -z "${JS_RUNTIME}" && -x /opt/homebrew/bin/node ]]; then
  JS_RUNTIME=/opt/homebrew/bin/node
fi
if [[ -z "${JS_RUNTIME}" ]]; then
  echo "node or bun is required for the publisher contract test" >&2
  exit 1
fi

set +e
INVALID_KEY_OUTPUT="$(
  BESKID_PCKG_API_KEY=not-a-publisher-key \
    "${JS_RUNTIME}" "${ROOT}/scripts/ci/lib/corelib-publish-runner.mjs" 2>&1
)"
INVALID_KEY_STATUS=$?
set -e
assert_eq "1" "${INVALID_KEY_STATUS}" \
  "production publication fails before work when the publisher key is malformed"
assert_contains "${INVALID_KEY_OUTPUT}" "canonical bpk_ publisher token" \
  "malformed publisher key failure identifies the canonical credential contract"

finish_tests
