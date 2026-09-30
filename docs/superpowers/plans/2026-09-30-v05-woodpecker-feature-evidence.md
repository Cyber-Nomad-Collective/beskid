# Beskid v0.5 Woodpecker Feature Evidence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Require source-bound native Foundations, Networking, and HTTP test evidence from each Woodpecker platform before the existing release aggregate can qualify.

**Architecture:** Extend the existing three-platform handoff and evidence validator. Each native worker runs a fixed set of Corelib test targets using the CLI and ABI-v5 release kit inside the extracted bundle, retains the raw per-target JSON logs, and emits a checksummed `feature-evidence-v1.json`. The aggregate verifies identity, bundled-kit and log digests, complete passing case coverage, and the explicit v0.5 Glue exclusion before it copies and revalidates its private evidence snapshot.

**Tech Stack:** Node.js, Bash, Woodpecker, `beskid_cli test --json`, SHA-256.

**Spec:** `docs/superpowers/plans/2026-09-19-beskid-v0-5-closure-rebaseline.md` (Cross-target behavioral evidence); `docs/superpowers/reports/2026-09-27-v05-candidate-readiness.md` (lines 640+).

## Global Constraints

- Use the existing Woodpecker release evidence route and its trusted worker handoffs.
- Require exact superrepo commit, compiler commit, release version, target triple, and staged target runtime-kit digest.
- Require executed conformance case IDs and SHA-256 verified retained test logs on Linux, macOS, and Windows.
- Represent Glue as `not_applicable` with a concrete v0.5 scope reason.
- Keep publication and deployment credentials out of the gate.
- Preserve the existing dirty readiness report and do not modify or build compiler/Corelib worktrees.
- Do not use GitNexus for this task (explicit user override).

## Review Focus

- Build-only platform evidence must no longer validate.
- Missing case IDs, non-passing target results, mismatched source/version/target/kit identity, missing logs, and modified logs must fail closed.
- Checksum parsing must allow exactly the newly declared evidence and log artifacts without accepting undeclared files.
- Glue exclusion must be a structured `not_applicable` record with the exact v0.5 reason, not an omitted or generic passing case.
- Platform workflows must run the evidence producer after the native kit exists and before handoff, on all three native workers.

---

### Task 1: Define and validate feature evidence

**Files:**
- Modify: `scripts/ci/woodpecker-release-evidence.mjs`
- Test: `scripts/ci/test/woodpecker-release-evidence.test.mjs`

- [x] Add fixture support for a complete source-bound feature record, a runtime-kit digest, required Foundations/Networking/HTTP case IDs, raw case logs, and Glue `not_applicable` reason.
- [x] Add failing validator tests for build-only handoffs, missing/unexecuted cases, source/version/target/runtime-kit digest mismatches, missing or tampered logs, and malformed or absent Glue scope reason.
- [x] Run `node --test scripts/ci/test/woodpecker-release-evidence.test.mjs` and confirm each new rejection fails for its intended reason.
- [x] Implement strict schema, identity, case, runtime-kit, log-hash and checksum validation; include feature artifacts in validated platform results.
- [x] Re-run the focused Node test file and confirm all tests pass.

### Task 2: Produce and hand off native behavioral evidence

**Files:**
- Create: `scripts/ci/woodpecker-feature-evidence.mjs`
- Modify: `scripts/ci/woodpecker-build-platform.sh`
- Modify: `.woodpecker/linux.yml`, `.woodpecker/macos.yml`, `.woodpecker/windows.yml`
- Test: `scripts/ci/test/woodpecker-build-platform.test.sh`, `scripts/ci/test/woodpecker-workflow-contract.test.sh`

- [x] Add producer tests using a fixture CLI to prove expected targets are invoked, actual executed IDs are recorded, failures stop evidence creation, and produced logs are hashed.
- [x] Run those tests and confirm the fixture can exercise the expected success path without a product build.
- [x] Implement native producer: validate source/version/target inputs and ABI-v5 runtime-kit metadata; hash the complete native kit deterministically; run the fixed Foundations, Networking and HTTP test targets through the platform CLI; retain their JSON logs; record actual passed test IDs and the explicit Glue v0.5 exclusion.
- [x] Invoke the producer from the shared native build wrapper on Linux/macOS/Windows, include generated logs and JSON in the platform checksum list, and keep handoff flat-file compatible.
- [x] Extend builder tests to require generated evidence and checksum coverage; the existing shared wrapper runs on all three workers before packaging/upload.
- [x] Run focused producer, builder, and workflow contract tests.

### Task 3: Preserve feature evidence through aggregation

**Files:**
- Modify: `scripts/ci/woodpecker-aggregate-release.mjs`
- Test: `scripts/ci/test/woodpecker-release-evidence.test.mjs`

- [x] Add aggregation tests proving feature JSON and logs survive the private snapshot; existing validator tests prove tampered or missing evidence blocks qualification.
- [x] Preserve validator-approved feature evidence and logs through handoff collection and private snapshot, then revalidate the snapshot before release state generation.
- [x] Run the focused evidence tests and root Woodpecker CI suite with `bash scripts/ci/test/run-woodpecker-tests.sh`.
- [x] Inspect `git diff --check` and the scoped diff; commit only this plan, implementation, and its tests on the assigned branch.

**Interfaces:** Producer output per platform is `feature-evidence-v1.json` plus named `feature-<case-id>.json` CLI reports. Platform `SHA256SUMS` covers those files. Validator output lists their verified names/digests and normalized feature evidence; the aggregator snapshots those exact files and runs the same validator against its snapshot.
