# Shared UI + Nexus web release gate

Authoritative root gate for shared React UI Vitest/jsdom and Nexus
`gitnexus-web` unit + Playwright E2E suites (Linear CYB-93). Package runners
are owned by CYB-89 / CYB-90; this document only covers root wiring.

## Do not use

- Bare recursive `bun test` at the repo root or under `gitnexus-web` (Bun’s
  runner has no jsdom and mixes Playwright specs; Nexus blocks it via
  `bunfig.toml`).
- Any gate path that forces suite skips. Package-level Playwright skips for an
  unreachable live API remain package behavior; the root gate does not add skip
  flags or `continue-on-error`.

## Local (same script as CI)

```bash
# Full gate (installs Playwright Chromium unless already present)
bash scripts/ci/shared-ui-nexus-gate.sh

# Or via root package script
bun run gate:shared-ui-nexus

# Optional: skip Chromium reinstall when browsers are already on the machine
SKIP_NEXUS_E2E_INSTALL=1 bun run gate:shared-ui-nexus
```

`./validate-ci-local.sh` also runs this gate alongside the other platform
delivery quality scripts.

## Mirrored package commands

| Suite | Root script | Package command |
| --- | --- | --- |
| Shared UI Vitest/jsdom | `bun run test:shared-ui` | `bun run --cwd=beskid_web_common test` |
| Nexus unit | `bun run test:nexus:unit` | `bun run --cwd=beskid_nexus/gitnexus-web test:unit` |
| Nexus E2E | `bun run test:nexus:e2e` | `bun run --cwd=beskid_nexus/gitnexus-web test:e2e` |
| Nexus package gate (unit then E2E) | `bun run test:nexus:gate` | `bun run --cwd=beskid_nexus/gitnexus-web test:gate` |

Use `bun run --cwd=DIR` (equals form). `bun --cwd DIR run SCRIPT` with a space
before `DIR` is misparsed by Bun and can exit 0 without executing the script.

Install Playwright Chromium once per machine / upgrade:

```bash
bun run test:nexus:e2e:install
# equivalent: bun run --cwd=beskid_nexus/gitnexus-web test:e2e:install
```

Package-level notes: `beskid_nexus/gitnexus-web/TESTING.md`.

## CI

`platform-delivery.yml` job `shared-ui-nexus` calls the same script through
`reusable-quality.yml`:

```yaml
command: bash scripts/ci/shared-ui-nexus-gate.sh
submodules: beskid_web_common beskid_nexus
```

Local and CI therefore share one authority path. Branch protection may require
the `shared-ui-nexus` check for merge; image publish remains decoupled from
quality gates (existing platform-delivery contract).

## Prerequisite diagnostics

Missing Bun, missing submodules, failed `bun install`, or failed Playwright
Chromium install exit with actionable stderr (commands to run, submodule init
hints, registry auth notes). Fix the reported step, then re-run the gate.

## Evidence handoff

Record totals from gate logs for CYB-87 / CYB-44. Do not mark those issues Done
from this wiring alone; do not claim 0.4 release-ready.
