#!/usr/bin/env bash
# Shared UI + Nexus web test gate (CYB-93).
#
# Invokes the authoritative package runners only — never bare recursive `bun test`:
#   1. beskid_web_common Vitest/jsdom (CYB-89)
#   2. gitnexus-web Vitest/jsdom unit (CYB-90)
#   3. gitnexus-web Playwright E2E (CYB-90)
#
# Local and CI use the same script. Root package.json mirrors the package
# commands; see docs/orchestrate/shared-ui-nexus-gate.md for parity notes.
#
# Env:
#   GATE_JUNIT_DIR  optional; emit JUnit via gate-harness
#   GATE_LOG_DIR    optional; step logs
#   SKIP_NEXUS_E2E_INSTALL=1  skip Playwright Chromium install when browsers
#                             are already present (local convenience only)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "${ROOT}"

# shellcheck disable=SC1091
source "${ROOT}/scripts/ci/lib/gate-harness.sh"

WEB_COMMON="${ROOT}/beskid_web_common"
NEXUS_WEB="${ROOT}/beskid_nexus/gitnexus-web"

die_prereq() {
  echo "shared-ui-nexus-gate: prerequisite failure" >&2
  echo "  $*" >&2
  exit 1
}

require_cmd() {
  local cmd="$1"
  local hint="$2"
  command -v "${cmd}" >/dev/null 2>&1 || die_prereq "missing '${cmd}'. ${hint}"
}

check_tree() {
  [[ -f "${WEB_COMMON}/package.json" ]] || die_prereq \
    "beskid_web_common/package.json missing — init submodule: ./scripts/ci/init-submodules.sh beskid_web_common"
  [[ -f "${NEXUS_WEB}/package.json" ]] || die_prereq \
    "beskid_nexus/gitnexus-web/package.json missing — init submodule: ./scripts/ci/init-submodules.sh beskid_nexus"
  [[ -f "${NEXUS_WEB}/vitest.config.ts" ]] || die_prereq \
    "gitnexus-web vitest.config.ts missing — pin beskid_nexus to a tip that includes CYB-90"
  [[ -f "${NEXUS_WEB}/playwright.config.ts" ]] || die_prereq \
    "gitnexus-web playwright.config.ts missing — pin beskid_nexus to a tip that includes CYB-90"
}

ensure_web_common_install() {
  if [[ ! -d "${WEB_COMMON}/node_modules" ]] && [[ ! -d "${WEB_COMMON}/packages/beskid-ui-react/node_modules" ]]; then
    echo "==> shared-ui-nexus-gate: installing beskid_web_common deps" >&2
    bun install --cwd="${WEB_COMMON}" --frozen-lockfile || die_prereq \
      "bun install failed in beskid_web_common. Fix lockfile/registry auth (NODE_AUTH_TOKEN for GitHub Packages if needed), then retry."
  fi
}

ensure_nexus_web_install() {
  if [[ ! -d "${NEXUS_WEB}/node_modules" ]]; then
    echo "==> shared-ui-nexus-gate: installing gitnexus-web deps" >&2
    bun install --cwd="${NEXUS_WEB}" --frozen-lockfile || die_prereq \
      "bun install failed in beskid_nexus/gitnexus-web. Fix lockfile/registry auth, then retry."
  fi
  if [[ ! -d "${ROOT}/beskid_nexus/gitnexus-shared/node_modules" ]] && [[ -f "${ROOT}/beskid_nexus/gitnexus-shared/package.json" ]]; then
    echo "==> shared-ui-nexus-gate: installing gitnexus-shared deps" >&2
    bun install --cwd="${ROOT}/beskid_nexus/gitnexus-shared" --frozen-lockfile || die_prereq \
      "bun install failed in beskid_nexus/gitnexus-shared (required by gitnexus-web file: dependency)."
  fi
}

require_cmd bun "Install Bun (https://bun.sh) and ensure it is on PATH."
check_tree
ensure_web_common_install
ensure_nexus_web_install

gate_init "shared-ui-nexus"

# Authoritative shared UI suite (Vitest + jsdom). Do not use bare `bun test`.
# Prefer `bun run --cwd=…` (equals form): `bun --cwd DIR run SCRIPT` with a
# space before DIR is misparsed by Bun and can exit 0 without running tests.
gate_step "shared-ui-vitest" -- bun run --cwd="${WEB_COMMON}" test

# Nexus unit suite — Vitest + jsdom only (no Playwright specs).
gate_step "nexus-unit-vitest" -- bun run --cwd="${NEXUS_WEB}" test:unit

# Browser prerequisite before E2E (actionable failure if install cannot complete).
gate_step "nexus-playwright-chromium" -- bash -c '
  set -euo pipefail
  NEXUS_WEB="'"${NEXUS_WEB}"'"
  if [[ "${SKIP_NEXUS_E2E_INSTALL:-}" == "1" ]]; then
    echo "SKIP_NEXUS_E2E_INSTALL=1 — assuming Chromium is already installed"
    exit 0
  fi
  if ! bun run --cwd="${NEXUS_WEB}" test:e2e:install; then
    echo "Playwright Chromium install failed." >&2
    echo "  Local: bun run --cwd=beskid_nexus/gitnexus-web test:e2e:install" >&2
    echo "  CI: ensure the runner can download browsers (network) and OS deps." >&2
    exit 1
  fi
'

# Nexus Playwright E2E — separate runner from unit (no mixing).
gate_step "nexus-e2e-playwright" -- bun run --cwd="${NEXUS_WEB}" test:e2e

gate_summary
gate_emit_junit

if gate_overall_rc; then
  echo "shared-ui-nexus-gate OK"
  exit 0
else
  echo "shared-ui-nexus-gate FAILED" >&2
  echo "  Shared UI:  bun run --cwd=beskid_web_common test" >&2
  echo "  Nexus unit: bun run --cwd=beskid_nexus/gitnexus-web test:unit" >&2
  echo "  Nexus E2E:  bun run --cwd=beskid_nexus/gitnexus-web test:e2e:install && bun run --cwd=beskid_nexus/gitnexus-web test:e2e" >&2
  echo "  Package both: bun run --cwd=beskid_nexus/gitnexus-web test:gate" >&2
  echo "  Docs: docs/orchestrate/shared-ui-nexus-gate.md" >&2
  exit 1
fi
