# CI Cleanup & Diagnosability — Design

**Status:** Proposed
**Date:** 2026-06-19
**Supersedes / extends:** `2026-06-18-normative-spec-migration-design.md` §11 (CICD cleanup) — finishes the half-landed work described there.
**Owner:** Piotr Mikstacki

## 1. Context & problem statement

The Beskid site/release lane has been red for the better part of a week. The
immediate symptom (`setup-beskid-web` failing in ~7s on
`bun install --frozen-lockfile`) looks like a CI mechanics problem. It is not.

### Root cause: the normative-spec migration landed out of order

The migration in `2026-06-18-normative-spec-migration-design.md` removed
`trudoc` from `spec-core` and detached `platform-spec` from `beskid-ui`/`trudoc`.
The `package.json` changes for that landed, but **`bun.lock` was never
re-committed**, and §11 of the migration design ("CICD cleanup") was only
half-applied to the shell scripts. The result, reproduced locally on a clean
`origin/main`:

```
$ bun install --frozen-lockfile
error: lockfile had changes, but lockfile is frozen
note: try re-running without --frozen-lockfile and commit the updated lockfile
```

The lockfile diff is small and surgical — it is the migration's own dependency
removals plus `@tanstack/*` patch re-resolutions — but it makes **every**
frozen-install gate fail the same way in under a second. That is the "0.5s fail"
pattern that has dominated the week.

### Why this felt like "fixing CI for a week"

Each commit fixed one symptom and exposed the next half-done step of the
migration. Concretely, the half-landed state is:

1. `bun.lock` is stale relative to `package.json` (the trigger).
2. `scripts/ci/platform-smoke.sh` runs `bun install --frozen-lockfile` **twice**
   (lines ~22 and ~31) — dead redundancy left from the partial §11 edit.
3. `scripts/ci/platform-smoke.sh` still carries a stale "NOTE: site/website
   prebuild … removed" comment block describing work that was supposed to be
   deleted, but the deletion of the redundant check wasn't completed.
4. `.github/actions/setup-beskid-web/action.yml` still asserts a trudoc-era
   submodule shape (`spec-core/package.json` mandatory, `beskid-ui` optional)
   that §11 was meant to relax.
5. `.github/workflows/beskid-platform.yml` carries a ~30-line duplicated
   `paths:` filter between `push:` and `pull_request:` — easy to drift.
6. A failure produces a one-line Bun error and no artifact. There is no
   per-gate report, no captured log fragment at the throw site, and no
   gate-test artifact attached to a release. Debugging meant re-reading raw
   GHA logs by hand.

### The original asks, reweighted by the diagnosis

| User ask | Reality after diagnosis |
|---|---|
| "Run all GHA checks locally before push" | A local preflight that runs the **same** `scripts/ci/*.sh` gates host-side catches *this* class of bug in seconds — `act`/podman would have caught it too, but no faster. `act`+podman still adds value for YAML/container fidelity, as an opt-in tier. |
| "Simplify and DRY refactor" | Highest-value work. The accretion above is exactly what made the week painful. |
| "Detailed report + log fragments + gate-test artifact on release" | Net-new, well-scoped. This is the diagnosability gap. |

## 2. Goals & non-goals

### Goals

1. **Get `main` green** by landing the missing lockfile commit and finishing
   the §11 cleanup (trudoc-era assertions relaxed, redundant install removed).
2. **DRY the CI surface** so the half-landed state can't recur: collapse the
   duplicated path filters, remove the double-install, centralize the
   frozen-lockfile check.
3. **Add a local preflight** (`just gate`, host-fast by default;
   `just gate --full` for act+podman YAML/container fidelity) so the exact
   gate scripts run locally before a push.
4. **Rich failure output**: per-gate pass/fail report, captured log fragment at
   the throw site, and a gate-test artifact (Markdown + JUnit XML) uploaded on
   every run and attached to releases.

### Non-goals

- Replacing Blacksmith Testbox. The compiler gate (`compiler-gate-testbox.yml`)
  cannot run under `act`/podman — its `useblacksmith/*-testbox` actions require
  live Blacksmith runner infra. It stays a Blacksmith-only check; only its
  underlying shell scripts get a host-callable wrapper for local iteration.
- Enforcing a git hook on every commit. (Explicitly rejected during design —
  too costly per-commit. Preflight is invoked manually via `just gate`.)
- Re-architecting the GHCR/Coolify deploy pipeline. The release lane's image
  matrix and deploy wiring are untouched; only report/artifact generation is
  added.
- Migrating off Bun, changing the workspace layout, or touching the
  normative-spec *content* model (that is the migration design doc's job).

## 3. Architecture overview

Four workstreams, sequenced so each unblocks the next.

```
WS1: Get green now ────────► WS2: DRY the CI surface
   (lockfile + §11 finish)        (path filters, double-install,
                                  centralized frozen-check)
        │                                │
        └────────► WS3: Local preflight ◄┘
                   (just gate / --full)      │
                        │                    ▼
                        │          WS4: Rich reports + artifact
                        │          (markdown + junit-xml,
                        │           log-fragment capture,
                        │           release artifact)
                        ▼
              gates become host-callable,
              so preflight + reports share one harness
```

WS3 and WS4 converge on a **single gate harness** (`scripts/ci/lib/gate-harness.sh`,
sourced by every gate script). The harness is what makes a gate
"host-callable," what captures the log fragment at the throw site, and what
emits the per-gate JUnit testcase. Building it once in WS2 lets WS3 (preflight)
and WS4 (reports) both consume it.

## 4. Workstream 1 — Get green now

Smallest possible change to turn `main` green. No refactor yet.

### 4.1 Land the stale lockfile

Regenerate and commit `bun.lock` so it matches the post-migration `package.json`.
The diff is already known (surgical: trudoc removals + tanstack patch
re-resolutions). This is the single commit that unblocks every frozen-install
gate.

### 4.2 Finish the §11 setup-beskid-web relaxation

`.github/actions/setup-beskid-web/action.yml` currently asserts:

```yaml
test -f beskid_web_common/packages/spec-core/package.json
test -f beskid_web_common/packages/beskid-ui/package.json || echo "warn: ..."
```

Per §11 of the migration design, after the detach the only mandatory package is
`spec-core`. Relax the assertion to check `spec-core/package.json` only; drop
the `beskid-ui` warning (it is no longer a meaningful signal post-detach). Keep
the `bun install --frozen-lockfile` step — that stays the gate, it just needs
the §4.1 lockfile to pass.

### 4.3 Finish the §11 platform-smoke cleanup

In `scripts/ci/platform-smoke.sh`:

- Remove the **second** `bun install --frozen-lockfile` call (the one inside
  the `if [[ -f package.json && -f bun.lock ]]` block at ~line 31). It is a
  dead duplicate of the call at ~line 22.
- Delete the stale "NOTE: site/website prebuild + verify:platform-spec-git-meta
  removed." comment block (~line 20). The work it describes is done; the
  comment is now noise.

**Verification for WS1:** `bun install --frozen-lockfile` exits 0 at root;
`bash scripts/ci/platform-smoke.sh` prints `platform-smoke OK`; a dry-run
`act -W .github/workflows/beskid-platform.yml -j smoke` (once WS3's podman
wiring exists) confirms the YAML path. Before WS3 lands, accept manual
re-confirmation on the next push.

## 5. Workstream 2 — DRY the CI surface

### 5.1 Centralize the path filter

`.github/workflows/beskid-platform.yml` duplicates a ~30-line `paths:` block
between `on.push` and `on.pull_request`. Use a YAML anchor:

```yaml
on:
  push:
    branches: [main, stg]
    paths: &platform-paths
      - 'site/**'
      - 'beskid_web_common'
      - 'beskid_web_common/**'
      # … full list …
  pull_request:
    branches: [main, stg]
    paths: *platform-paths
```

Single source of truth; drift between push and PR triggers becomes impossible.
(GitHub Actions resolves anchors at parse time, so this is safe.)

### 5.2 Centralize the frozen-lockfile check

Today, `bun install --frozen-lockfile` is invoked inline in at least four
places: `setup-beskid-web`, `platform-smoke` (×2, see WS1), `site-build-gate`
(per-app), and `container-images` via `verify-frozen-lockfile.sh`. Replace the
inline calls in `platform-smoke` and `site-build-gate` with a call to the
existing `scripts/ci/verify-frozen-lockfile.sh`, extended to accept a single
dir or a comma-list. One frozen-check implementation, invoked everywhere.

`setup-beskid-web` keeps its own `bun install --frozen-lockfile` because it
runs inside a composite action before any script is guaranteed on PATH — but
the *semantics* are now identical to the script-backed check, and both are
documented as "the canonical frozen check."

### 5.3 The gate harness (`scripts/ci/lib/gate-harness.sh`)

A sourced library (not executed standalone) giving every gate script four
capabilities:

```bash
# scripts/ci/lib/gate-harness.sh — sourced.

gate_init <gate-name>        # sets GATE_NAME, GATE_LOG, GATE_JUNIT_DIR
gate_step <step-name> -- <cmd...>   # run a sub-step; capture pass/fail + log fragment
gate_summary                 # print per-gate pass/fail summary
gate_emit_junit              # write JUnit XML for this gate to GATE_JUNIT_DIR
gate_fail_fragment <lines>   # print the last <lines> of the failing step's log
```

Design rules for the harness:

- **Sourced, not exec'd.** Gate scripts `source` it; the harness never runs as
  its own process. This keeps `set -euo pipefail` semantics owned by the
  caller.
- **No new runtime deps.** Pure bash + coreutils. No `jq`, no Node. The
  release lane runs on a clean runner; introducing a dep here would itself
  become a CI failure mode.
- **Idempotent log capture.** Each `gate_step` tees its output to
  `$GATE_LOG/<gate>/<step>.log`. On failure, `gate_fail_fragment` prints the
  tail of that step's log inline — that is the "log fragment where it threw."
- **JUnit emission is optional.** `GATE_JUNIT_DIR` unset → no XML written.
  This is what lets the same scripts run fast and quiet under `just gate`
  (host) and verbose+XML under GHA.

### 5.4 Refactor the existing gates onto the harness

`platform-smoke.sh`, `site-build-gate.sh`, `verify-frozen-lockfile.sh`, and
`build-release-artifact.sh` each get a thin rewrite: wrap each existing
command in `gate_step <name> -- <cmd>`, end with `gate_summary` +
`gate_emit_junit`. Behavior is unchanged; the only observable difference is
structured output and a per-gate exit code that reflects the worst step.

## 6. Workstream 3 — Local preflight (`just gate`)

### 6.1 The `just gate` recipe

Added to `justfile`, alongside the existing `setup` / `deps-check` /
`test-corelib-spine` recipes:

```just
# Run the host-callable CI gates locally (fast tier). Fails fast on lockfile
# drift, frozen-check failures, normative-spec validation errors.
gate args='':
    "{{root}}/scripts/local-preflight.sh" {{args}}

# Full-fidelity run: host tier first, then act+podman for YAML/container gates.
gate-full:
    "{{root}}/scripts/local-preflight.sh" --full
```

(`gate` accepts `--full` via args so `just gate --full` also works; the
dedicated `gate-full` alias is a convenience.)

### 6.2 `scripts/local-preflight.sh`

Two tiers, same entrypoint:

**Host tier (default, seconds):**

1. `verify-frozen-lockfile.sh . site/website site/auth site/platform-spec
   beskid_web_common` — the lockfile drift check that would have caught the
   current week's failure instantly.
2. `platform-smoke.sh` — root workspace install + structure.
3. `site-build-gate.sh auth` and `site-build-gate.sh platform-spec` — the two
   app builds. **Skip rule:** if `BESKID_NODE_AUTH_TOKEN` is unset, each app
   gate prints `SKIP: set BESKID_NODE_AUTH_TOKEN to run <app> gate` and exits
   0 *for that gate only* — it does not fail the preflight and does not affect
   other gates. The token is needed only for the `@beskid/*`/`@cyber-nomad-*`
   GitHub Packages deps; the frozen-lockfile check itself (§5.2) does not need
   the token and runs regardless.
4. Normative spec validation — the same `validate-workspace.ts` invocation
   `normative-spec.yml` runs, against `site/spec-content`.
5. **Explicitly excluded from host tier:** compiler gate (Testbox-only, see
   non-goals), GHCR image builds (need a registry), Coolify deploy.

**Full tier (`--full`, minutes):**

Runs the host tier first (fail-fast), then shells out to `act` with the
podman socket:

```bash
podman system service --time=0 unix:///tmp/podman.sock &
export DOCKER_HOST=unix:///tmp/podman.sock
act -W .github/workflows/beskid-platform.yml \
    --container-architecture linux/amd64 \
    --secret NODE_AUTH_TOKEN …
```

- `--full` runs only the act-runnable workflows: `beskid-platform`,
  `container-images`, `normative-spec`, `release` (images job, deploy skipped
  via env). It prints a clear **SKIP** line for `compiler-gate-testbox` with
  the reason, rather than failing.
- podman socket startup is guarded; if `podman` is absent, `--full` prints
  install instructions and exits non-zero rather than silently degrading.

### 6.3 `just deps-check` extension

`scripts/install-deps.sh --check` is extended to also verify `act` and
`podman` are present, reporting them as `optional (needed for just gate
--full)` rather than hard-required. The host tier needs only `bun` + `node`,
which are already checked.

## 7. Workstream 4 — Rich reports & release artifact

### 7.1 Report format

Two artifacts per run, both produced from the same JUnit XML:

1. **`gate-report.md`** — human-readable, renders on GitHub. One section per
   gate, each with: status badge, duration, the failing step, and the captured
   log fragment (the "where it threw" tail).
2. **`gate-report.junit.xml`** — machine-readable, consumed by
   `dorny/test-reporter@v1` for native GHA test annotations and available for
   future ingestion by `beskid_tracker`/`beskid_nexus`.

### 7.2 The report builder

`scripts/ci/build-gate-report.sh <junit-dir> <out-dir>` — pure bash + coreutils
(plus a tiny XSLT-free XML emitter), reads the JUnit files the harness wrote
and emits both artifacts. No Node dependency; it must run on a clean runner
that may not have done `bun install` yet (a failed install is exactly when we
need the report).

### 7.3 Wiring into workflows

Every gate-bearing workflow (`beskid-platform`, `container-images`,
`normative-spec`) gains a final `report` job:

```yaml
  report:
    if: always()
    needs: [smoke, …]   # all gate jobs
    runs-on: blacksmith-4vcpu-ubuntu-2404
    steps:
      - uses: actions/checkout@v6
      - name: Collect gate JUnit
        uses: actions/download-artifact@v6
        with: { pattern: gate-junit-* , path: junit, merge-multiple: true }
      - name: Build report
        run: scripts/ci/build-gate-report.sh junit report
      - uses: dorny/test-reporter@v1
        with: { name: 'Gate report', path: 'report/gate-report.junit.xml',
                reporter: java-junit }
      - uses: actions/upload-artifact@v6
        with: { name: gate-report, path: report/ }
```

Each gate job uploads its JUnit dir as `gate-junit-<gate>` via
`actions/upload-artifact@v6`; the `report` job merges and converts. `if:
always()` means the report is produced even when gates fail — which is the
whole point.

### 7.4 Release artifact

`release.yml` gains a `gate-report` job that runs after `images`, rebuilds the
report from the release run's JUnit artifacts, and attaches
`gate-report.md` (and the XML) to the release via
`softprops/action-gh-release@v2`. This satisfies "detailed gate test report as
artifact on release." The report reflects the release run's actual gate
results, not a re-run.

## 8. Data flow — how a failure is reported

```
gate script (platform-smoke.sh)
   │  source gate-harness.sh
   │  gate_step "root-install" -- bun install --frozen-lockfile
   │      ├─ tees stdout/stderr → GATE_LOG/platform-smoke/root-install.log
   │      └─ on failure: record step result, capture tail as fragment
   ▼
gate_emit_junit  →  GATE_JUNIT_DIR/platform-smoke.xml
   │
   ├─ (local)   just gate prints gate_summary + fail fragment to terminal
   └─ (GHA)     upload-artifact gate-junit-platform-smoke
                    ▼
                report job: download-artifact → build-gate-report.sh
                    ├─ gate-report.md   (per-gate sections + fragments)
                    └─ gate-report.junit.xml  (dorny/test-reporter annotations)
                    ▼
                upload-artifact gate-report  +  (on release) attach to release
```

The key property: the **same log-fragment capture** runs locally and in CI.
If a failure reproduces under `just gate`, you see the identical fragment you
would see in the GHA report — no "works on my machine" gap between the two
environments for the host-tier gates.

## 9. Testing

### Unit-ish (pure bash)

- `scripts/ci/test/gate-harness.bats` — Bats tests for the harness: pass path,
  fail path, fragment capture, JUnit well-formedness, idempotent re-source.
- `scripts/ci/test/build-gate-report.bats` — feed a fixtures JUnit dir, assert
  the markdown sections and XML structure.

(If Bats is not already a dev dep, add it vendored under
`scripts/ci/test/lib/` to avoid a new system dependency. Confirm during
planning.)

### Integration

- Run `just gate` on a clean checkout after WS1+WS2: expect all-green.
- Introduce a deliberate lockfile drift (drop a dep from `package.json`,
  don't regenerate): expect `just gate` to fail at the frozen-check step with
  the Bun error as the captured fragment. Revert.
- Run `just gate --full` against podman: expect host tier green, act tier to
  reproduce the `beskid-platform` smoke job result.

### CI verification

- On the PR that lands WS4, the `report` job must produce a non-empty
  `gate-report.md` even when a gate is intentionally failing (test by
  temporarily flipping a gate to fail in a draft commit, confirm report,
  revert before merge).

## 10. Rollout & sequencing

Strict order; each WS is one PR (or a small stack). Do not combine.

1. **PR-1 (WS1):** lockfile commit + §11 setup-beskid-web/platform-smoke
   cleanup. Lands `main` green. Smallest possible review surface.
2. **PR-2 (WS2):** path-filter anchor, centralized frozen-check, gate harness,
   gate rewrites. No behavior change observable to GHA beyond structured
   output; existing green stays green.
3. **PR-3 (WS3):** `just gate` + `local-preflight.sh` + `deps-check` extension.
   No GHA change at all; pure local tooling.
4. **PR-4 (WS4):** report builder + workflow `report` jobs + release artifact
   job. Builds on the harness from PR-2.

Each PR's CI run *is* its own acceptance test — by PR-4, the report job proves
itself on the PR that introduces it.

## 11. Risks

| Risk | Mitigation |
|---|---|
| YAML anchors not supported in some GHA context | Anchors are resolved by the Actions parser before job evaluation; this is standard and used across the ecosystem. Validate on PR-2. |
| `act` + podman socket flakiness on macOS (rootless) | `--full` is opt-in and fail-fast; host tier is the default and is what catches the lockfile-class bugs. Document the podman-on-macOS rootless caveat in `just gate --help`. |
| `dorny/test-reporter` needs `permissions: checks: write` | Add the permission scoped to the `report` job only, not workflow-wide. |
| Bats as a new dev dep | Vendor it under `scripts/ci/test/lib/` rather than `brew install`; no system change. Revisit in planning if vendoring is awkward. |
| Harness refactor (WS2) changes gate exit semantics | WS2 PR must show before/after parity on an all-green run + a deliberately-failing run; exit codes must match. |
| Report job runs on failure (`if: always()`) — cost | Report job is seconds (bash + artifact upload); negligible vs. the gate jobs themselves. |

## 12. Out of scope (explicit)

- Compiler gate under `act` (physically impossible — Testbox actions).
- Per-commit git hooks (rejected during design — too costly).
- GHCR/Coolify deploy rework (untouched; only report hooks added).
- Normative-spec content model (owned by the migration design doc).
- Migration off Bun or workspace layout changes.

## 13. Glossary

- **Gate** — a CI script that must pass for a lane to be green
  (`platform-smoke`, `site-build-gate`, `verify-frozen-lockfile`, the compiler
  gate, normative validation).
- **Host tier** — the subset of gates runnable directly on the developer
  machine without containers (everything except Testbox, GHCR, deploy).
- **Full tier** — host tier + `act`/podman for YAML/container fidelity.
- **Gate harness** — the sourced bash library (`scripts/ci/lib/gate-harness.sh`)
  that gives every gate structured output, log-fragment capture, and JUnit
  emission.
