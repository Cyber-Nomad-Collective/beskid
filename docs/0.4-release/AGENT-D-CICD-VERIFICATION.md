# Agent D - CI/CD Fixes, Verification, and Release Sign-off

> Provider note (2026-09-09): the GitHub Actions/Coolify/GHCR instructions in
> the original v0.4 evidence plan are retired. Use `appveyor.yml` for current
> CI evidence, `cr.beskid-lang.org` for platform images, and Watchtower for
> production reconciliation. Historical run identifiers below remain evidence
> of the old path only.

## Scope
Fix failing CI workflows, run fresh full-workspace verification, update tracker seed data, and assemble final release evidence for sign-off.

## Issues (5 + live CI failures)

| ID | Pri | Title | Dependencies |
|----|-----|-------|--------------|
| (CI) | - | Verify AppVeyor platform and native compiler lanes | - |
| CYB-40 | Urgent | Fresh full compiler workspace verification | Agent A, C |
| CYB-41 | Urgent | Corelib, installed-prefix, package verification | Agent B, 40 |
| CYB-172 | Medium | Update tracker v0.4 seed data for corelib completion | - |
| CYB-177 | Medium | Tracker: update v0.4 seed data for refactor evidence | - |
| CYB-11 | Urgent | W7: Run release gates and record sign-off (In Progress) | All |

## Phase 1: Fix Failing CI (immediate, parallel with other agents)

### Historical platform-delivery failures
- Runs 30137231431 and 30136890395 belong to the retired GitHub workflow.
- Do not repair or restore `platform-delivery.yml` or its reusable workflows.
- Prove the AppVeyor `linux-platform` lane, private-registry credentials, five
  `sha-*` tags, five `production` tags, and Watchtower convergence instead.

### Corelib gate failure
- Run: 30136890217 (failure)
- This depends on Agent A ISLE lowering fixes - the corelib gate will fail until those are done
- For now, document the failure and link to the blocking CYB issues

### Tracker platform delivery failure
- Runs: 30137231366 and 30136890232 (failure)
- Check if tracker submodule is properly checked out in CI
- Verify beskid_tracker data files are valid JSON

## Phase 2: Fresh Verification (after Agent A + C complete)

### CYB-40 - Full compiler workspace verification
  cd compiler
  cargo clean
  cargo test --workspace --all-targets -- --test-threads=4
Capture: commands, revisions, environment, durations, pass/fail counts, artifacts.

### CYB-41 - Corelib, installed-prefix, package verification
  CORELIB_REPORT_DIR=tmp bash scripts/ci/corelib-gate.sh
  BESKID_RUNTIME_PREFIX=target/native-runtime-kit ./target/release/beskid_cli test --project corelib_tests.bproj --plain
  cargo test -p beskid_tools --all-targets

## Phase 3: Tracker Seed Data (parallel with Phase 2)

### CYB-172 + CYB-177
Update beskid_tracker/data/v0.4/:
- v04-corelib-complete deliverable: mark complete
- corelib-matrix-green: update from baseline 5/42 to current pass count
- Sync all task statuses with their corresponding Linear issues
- Update for corelib structural refactor (Regex.bd split, String.bd split, etc.)

## Phase 4: Release Sign-off (after all phases complete)

### CYB-11 - W7: Run release gates and record sign-off
- Run the AppVeyor migration contract and actionlint on retained GitHub-native workflows
- Run documentation checks (OpenSpec validate-standard, catalog generation)
- Run GitNexus changed-scope analysis
- Assemble evidence bundle: exact commits, submodule pins, commands, CI runs, reports
- Confirm all parent/subissues are complete
- Confirm no waivers or compatibility fallbacks remain

## Key Files
- appveyor.yml and scripts/ci/appveyor-* - CI and platform publication
- .github/workflows/ - GitHub-native publication and maintenance only
- scripts/ci/corelib-gate.sh - corelib gate script
- beskid_tracker/data/v0.4/ - tracker seed data
- openspec/catalog.json - spec catalog
- CHANGELOG.md - release changelog

## Acceptance
- All required AppVeyor lanes green on main
- cargo test --workspace --all-targets passes from clean checkout
- Corelib gate passes all test targets
- Three-target matrix smokes pass
- Tracker seed data matches Linear issue statuses
- OpenSpec validate-standard passes
- Release evidence bundle assembled with exact SHAs
- No unresolved high/medium release-risk findings
