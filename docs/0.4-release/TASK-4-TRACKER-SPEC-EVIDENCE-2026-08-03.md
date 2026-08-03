# v0.4 Task 4 tracker and OpenSpec evidence reconciliation

**Status:** release closure remains in progress; this report is not sign-off
evidence.

## Candidate identity

| Item | Value |
| --- | --- |
| Root baseline | `origin/main` `34fa4152` |
| Tracker baseline | `origin/main` `e543e94` |
| Active normative ledger | `openspec/changes/hir-free-isle-abi-v5-native-runtime/tasks.md` |

## Tracker local-main reconciliation

The source tracker checkout was three commits ahead of `origin/main`:
`cfd3d15`, `bdbdc17`, and merge commit `42b5bde`. They are not carried into
the candidate:

| Commit | Finding | Disposition |
| --- | --- | --- |
| `cfd3d15` | Adds an importer that rewrites invalid seed status values in memory and forces the corelib task to Done. | Rejected; repair the source seed instead. |
| `bdbdc17` | Marks the corelib task Done from historical claims. | Rejected; no fresh candidate evidence. |
| `42b5bde` | Contains unresolved merge-conflict markers in `corelib-matrix-green.json`. | Rejected. |

The candidate seed now uses schema-valid `In Progress` statuses. Its corelib
task deliberately retains no completed subtask until the reconciled candidate
has a fresh corelib report.

## Normative status

The active OpenSpec ledger leaves release-critical work unchecked across every
remaining phase: retired-pattern/provenance scanning (`1.4`); generated
operation inventory and canonical runtime/kit authorities (`2.3`, `2.6` through
`2.7`); consumer migration (`3.1` through `3.6`); legacy retirement (`4.1`
through `4.5`); verification and release (`5.1` through `5.6`); the release
execution waves (`6.3` through `6.7`); canonical-runtime and kit completion
(`6.8.*`); consumer-migration-before-deletion (`6.9.*`); and retirement,
provenance, and sign-off (`6.10.1` through `6.10.3`).

Therefore neither tracker seed data nor this report marks v0.4, its corelib
matrix, or any linked release work Done.

## Fresh command evidence

| Command | Result |
| --- | --- |
| `pnpm install --frozen-lockfile` | Passed at the root candidate. |
| `pnpm run openspec:validate` | Passed: 204 items, 0 failures. |
| `pnpm run openspec:catalog` | Passed: rebuilt 196 capabilities and 552 requirements at revision `248855a3b994`; `openspec/catalog.json` had no diff. |
| `pnpm --dir beskid_tracker run seed:validate` | Pending tracker-local dependency installation, then rerun after the seed repair. |

## Remaining release facts

The following cannot be inferred from historical seed text and remain required
before an evidence-backed status change:

1. Reconciled compiler and nested-corelib SHAs plus fresh focused/workspace and
   corelib results.
2. Linux, macOS arm64, and Windows x86-64 installed-prefix debug/release
   runtime-kit JIT/AOT evidence, including unavailable-host records where
   applicable.
3. Retired-path and artifact-provenance results, package/actionlint checks,
   GitNexus changed-scope analysis, and a whole-branch review.
4. Exact command outputs and immutable links needed to update CYB-11 or close
   any child issue.

Until those facts exist, the active OpenSpec checkboxes and the tracker
projection must remain in progress.
