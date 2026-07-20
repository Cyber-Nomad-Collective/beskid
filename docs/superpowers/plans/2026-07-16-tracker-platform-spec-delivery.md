# Tracker, Platform Spec, and Delivery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver authenticated OpenSpec PR editing, Tracker-owned versions and delivery data, deterministic history backfill, cross-site typed links, enhanced task UX, and GitHub Actions gates.

**Architecture:** OpenSpec is normative; Platform Spec retains its current tree and projects catalog/OpenSpec edits through authenticated pull requests. Tracker owns versions, workstreams, task state, and provenance, publishing one API used by Website, Platform Spec, Nexus, and CI.

**Tech Stack:** Bun 1.3.14, TypeScript 6, React 19, TanStack Start, Bun SQLite, Vitest, Octokit, OpenSpec 1.4.1, GitHub Actions.

## Global Constraints

- `openspec/specs/**` is the sole normative authority; its catalog is generated metadata.
- Do not reorganize `site/platform-spec/`.
- Tracker GitHub synchronization stays bug-only; Platform Spec uses the authenticated user to create OpenSpec PRs.
- Tracker owns SemVer versions, workstreams, tasks, delivery state, and Git provenance.
- Every task belongs to exactly one version and workstream; spec links contain stable ID plus catalog revision.
- Ambiguous history stays explicitly unmapped and cannot be auto-applied.
- Write and observe failing Vitest coverage before production code.
- Run GitNexus upstream impact analysis before editing symbols, and change detection before integration commit.
- Update `CHANGELOG.md` and `GLOSSARY.md`; never commit agent scratch data.

---

## File Structure

| Path | Responsibility |
| --- | --- |
| `openspec/changes/add-tracker-platform-delivery-sync/**` | Normative deltas and acceptance scenarios. |
| `beskid_tracker/src/lib/tracker/delivery-contract.ts` | Shared Tracker delivery/link types and validation. |
| `beskid_tracker/src/lib/tracker/reconciliation.ts` | Pure DB/data/catalog diff and transactional application. |
| `beskid_tracker/src/lib/tracker/history-backfill.ts` | Version-band git provenance proposal. |
| `beskid_tracker/src/routes/api/v1/delivery/**` | Public latest-version, version, and typed-link APIs. |
| `site/platform-spec/src/server/git-sync/pr.ts` | Authenticated draft-to-PR path with ledger/idempotency. |
| `beskid_tracker/src/components/task-display.tsx` | Shared configurable card/preview renderer. |
| `.github/workflows/tracker-platform-delivery.yml` | PR and main verification gate. |

### Task 1: Normative and delivery contract

**Files:**
- Create: `openspec/changes/add-tracker-platform-delivery-sync/{proposal.md,design.md,tasks.md}`
- Create: `openspec/changes/add-tracker-platform-delivery-sync/specs/tracker-platform-delivery/spec.md`
- Create: `beskid_tracker/src/lib/tracker/delivery-contract.ts`
- Create: `beskid_tracker/src/lib/tracker/delivery-contract.test.ts`

**Interfaces:**
- Produces `TrackerSpecLink`, `DeliveryLatest`, `DeliveryVersion`, and `TypedLinkTarget`.
- These names are used unchanged by Tasks 2–6.

- [x] **Step 1: Write failing tests**

```ts
import { expect, test } from "vitest";
import { assertTrackerSpecLink, isPublicDeliveryVersion } from "./delivery-contract";

test("requires a stable spec identifier and catalog revision", () => {
  expect(() => assertTrackerSpecLink({ standardId: "", catalogRevision: "" })).toThrow();
});
test("allows only released public versions to be latest", () => {
  expect(isPublicDeliveryVersion({ status: "Released", visibility: "public" })).toBe(true);
  expect(isPublicDeliveryVersion({ status: "Planned", visibility: "public" })).toBe(false);
});
```

- [x] **Step 2: Verify red**

Run: `bun --cwd beskid_tracker run test src/lib/tracker/delivery-contract.test.ts`

Expected: FAIL because `delivery-contract.ts` does not exist.

- [x] **Step 3: Implement the minimal contract and OpenSpec delta**

```ts
export interface TrackerSpecLink {
  standardId: string;
  catalogRevision: string;
  relation: "implements" | "verifies" | "blocks" | "relates";
}
export function assertTrackerSpecLink(link: Pick<TrackerSpecLink, "standardId" | "catalogRevision">): void {
  if (!link.standardId || !link.catalogRevision) throw new Error("OpenSpec link requires standardId and catalogRevision");
}
```

Define the public delivery and typed-link interfaces in the same module. Add OpenSpec scenarios for PR-backed Platform Spec edits, revisioned Tracker links, Tracker version authority, and bug-only GitHub synchronization.

- [x] **Step 4: Verify green**

Run: `bun --cwd beskid_tracker run test src/lib/tracker/delivery-contract.test.ts && openspec validate add-tracker-platform-delivery-sync --strict --no-interactive`

Expected: PASS.

- [x] **Step 5: Commit**

```bash
git add openspec/changes/add-tracker-platform-delivery-sync beskid_tracker/src/lib/tracker/delivery-contract.ts beskid_tracker/src/lib/tracker/delivery-contract.test.ts
git commit -m "spec: define tracker platform delivery contracts"
```

### Task 2: Tracker reconciliation, relation persistence, and workstream enforcement

**Files:**
- Modify: `beskid_tracker/src/lib/storage/schema.ts`
- Modify: `beskid_tracker/src/lib/tracker/types.ts`
- Modify: `beskid_tracker/src/lib/tracker/load-from-db.ts`
- Modify: `beskid_tracker/src/lib/tracker/import-catalog.ts`
- Modify: `beskid_tracker/src/lib/tracker/repositories/{tasks-repository.ts,versions-repository.ts}`
- Create: `beskid_tracker/src/lib/tracker/reconciliation.ts`
- Create: `beskid_tracker/src/lib/tracker/reconciliation.test.ts`

**Interfaces:**
- Consumes Task 1 `TrackerSpecLink`.
- Produces `planTrackerReconciliation(input): ReconciliationPlan` and `applyTrackerReconciliation(db, plan): ReconciliationSummary`.

- [x] **Step 1: Write failing tests**

```ts
test("plans create, stale, and conflict operations without mutation", () => {
  const plan = planTrackerReconciliation({ database: fixtureDb, seed: fixtureSeed, catalog: fixtureCatalog });
  expect(plan.create).toHaveLength(1);
  expect(plan.stale).toEqual([{ taskId: "old-task", reason: "catalog-revision" }]);
  expect(plan.conflicts).toEqual([{ taskId: "edited-task", reason: "local-and-seed-diverged" }]);
});
test("round trips standardId and catalogRevision from SQLite", () => {
  expect(loadVersionSeedFromDb("v0.5").tasks[0]?.specRelations[0]).toMatchObject({
    standardId: "req:parser", catalogRevision: "catalog-5",
  });
});
```

- [x] **Step 2: Verify red**

Run: `bun --cwd beskid_tracker run test src/lib/tracker/reconciliation.test.ts`

Expected: FAIL because reconciliation and catalog revision persistence do not exist.

- [x] **Step 3: Implement migration and plan/apply boundary**

Increase `SCHEMA_VERSION`; add version visibility/catalog revision, relation catalog revision, and task-provenance range storage. Preserve `standardId` in `taskToSeed`. Reject a task workstream that is not present for its version. Make reconciliation planning pure and require an approved proposal digest for mutations.

- [x] **Step 4: Verify green**

Run: `bun --cwd beskid_tracker run test src/lib/tracker/reconciliation.test.ts src/lib/tracker/import-catalog.test.ts`

Expected: PASS.

- [x] **Step 5: Commit**

```bash
git add beskid_tracker/src/lib/storage/schema.ts beskid_tracker/src/lib/tracker
git commit -m "feat(tracker): reconcile delivery catalog state"
```

### Task 3: History backfill and public delivery API

**Files:**
- Create: `beskid_tracker/data/version-bands.json`
- Create: `beskid_tracker/src/lib/tracker/history-backfill.{ts,test.ts}`
- Create: `beskid_tracker/src/routes/api/v1/delivery/{latest.ts,$version.ts,delivery-api.test.ts}`
- Create: `beskid_tracker/src/routes/api/v1/links/$target.ts`
- Modify: `beskid_tracker/package.json`

**Interfaces:**
- Consumes Task 2 data/reconciliation.
- Produces `planHistoryBackfill(ledger, commits): BackfillProposal`, `GET /api/v1/delivery/latest`, `GET /api/v1/delivery/:version`, and `GET /api/v1/links/:target`.

- [x] **Step 1: Write failing tests**

```ts
test("puts ambiguous commits in an explicit unmapped bucket", () => {
  expect(planHistoryBackfill(fixtureLedger, [{ sha: "abc", subject: "cleanup", repository: "root" }]).unmapped)
    .toEqual([{ sha: "abc", confidence: "unmapped" }]);
});
test("returns only newest public released version", async () => {
  expect(await latestDelivery(fixtureDb)).toMatchObject({ version: "0.5.0", catalogRevision: "catalog-5" });
});
```

- [x] **Step 2: Verify red**

Run: `bun --cwd beskid_tracker run test src/lib/tracker/history-backfill.test.ts src/routes/api/v1/delivery/delivery-api.test.ts`

Expected: FAIL because the planner and API do not exist.

- [x] **Step 3: Implement deterministic planner and routes**

Define reviewed repository/range/workstream/catalog-revision records in `version-bands.json`. Sort by repository/SHA, assign only explicit mappings, mark `exact | inferred | unmapped`, and hash canonical JSON into `proposalDigest`. Add `backfill:plan` (plan-only) and `reconcile:plan`/`reconcile:apply` scripts. API responses use `Cache-Control: public, max-age=300` and reject unknown/non-public versions.

- [x] **Step 4: Verify green**

Run: `bun --cwd beskid_tracker run test src/lib/tracker/history-backfill.test.ts src/routes/api/v1/delivery/delivery-api.test.ts && bun --cwd beskid_tracker run backfill:plan -- --ledger data/version-bands.json --dry-run`

Expected: PASS; dry run writes no database state.

- [x] **Step 5: Commit**

```bash
git add beskid_tracker/data/version-bands.json beskid_tracker/src/lib/tracker/history-backfill.ts beskid_tracker/src/routes/api/v1 beskid_tracker/package.json
git commit -m "feat(tracker): publish delivery versions and backfill plans"
```

### Task 4: Platform Spec authenticated PR sync and Tracker task embeds

**Files:**
- Modify: `site/platform-spec/src/server/git-sync/pr.{ts,test.ts}` (ledger/idempotency; orphan `openspec/pr-sync` removed)
- Modify: `site/platform-spec/src/routes/api/webhooks/github.ts`
- Create: `site/platform-spec/src/routes/api/v1/tracker/{tasks.ts,tasks.test.ts}`
- Create: `site/platform-spec/src/components/reader/tracker-task-embed.tsx`
- Modify: `site/platform-spec/src/components/reader/spec-document-view.tsx`

**Interfaces:**
- Consumes Task 1 `TrackerSpecLink` and Task 3 delivery APIs.
- Produces `openOpenSpecEditPullRequest(input, octokit): Promise<OpenSpecPullRequest>`.

- [x] **Step 1: Write failing tests**

```ts
test("reuses an open pull request for an identical editor batch", async () => {
  await expect(openOpenSpecEditPullRequest(fixtureBatch, octokit)).resolves.toMatchObject({ number: 42, reused: true });
});
test("rejects a stale catalog revision", async () => {
  await expect(openOpenSpecEditPullRequest({ ...fixtureBatch, sourceRevision: "old" }, octokit))
    .rejects.toThrow("catalog revision conflict");
});
```

- [x] **Step 2: Verify red**

Run: `bun --cwd site/platform-spec run test src/server/git-sync/pr.test.ts src/routes/api/v1/tracker/tasks.test.ts`

Expected: FAIL because adapter/routes do not exist.

- [x] **Step 3: Implement authenticated and idempotent sync**

Verify GitHub write access for the signed-in user, serialize edit batches deterministically into `openspec/changes/platform-spec-<batch-id>/`, then create/update `platform-spec/<login>/<batch-id>` and one PR. Persist the batch/source revision/PR ledger. Refresh Platform Spec only for merged PR catalog revisions. Task embeds and creates call Tracker with stable OpenSpec IDs and revisions; no Platform Spec directory restructuring or direct normative writes occur.

- [x] **Step 4: Verify green**

Run: `bun --cwd site/platform-spec run test src/server/git-sync/pr.test.ts src/routes/api/v1/tracker/tasks.test.ts && bun --cwd site/platform-spec run typecheck`

Expected: PASS.

- [x] **Step 5: Commit**

```bash
git add site/platform-spec/src/server/openspec site/platform-spec/src/routes/api site/platform-spec/src/components/reader
git commit -m "feat(platform-spec): synchronize edits through OpenSpec pull requests"
```

### Task 5: Configurable task rendering, structural dialog, and smooth kanban

**Files:**
- Create: `beskid_tracker/src/lib/roadmap/task-display.{ts,test.ts}`
- Create: `beskid_tracker/src/components/task-display.{tsx,test.tsx}`
- Modify: `beskid_tracker/src/components/{roadmap-kanban-board.tsx,create-task-work-item.tsx}`
- Modify: `beskid_tracker/src/server/issues.ts`

**Interfaces:**
- Produces `TaskDisplayConfig`, `TaskDisplay`, and `moveIssueColumn({ versionId, taskId, targetColumn, targetIndex })`.

- [x] **Step 1: Write failing tests**

```ts
test("uses configured property ordering for card and preview", () => {
  expect(selectTaskProperties(task, { properties: ["priority", "workstream"] }))
    .toEqual([["priority", "High"], ["workstream", "compiler"]]);
});
test("persists a same-column reorder", async () => {
  await moveIssueColumn({ data: { versionId: "v0.5", taskId: "two", targetColumn: "In progress", targetIndex: 0 } });
  expect(listTrackerTasks("v0.5").map((task) => task.id)).toEqual(["two", "one"]);
});
```

- [x] **Step 2: Verify red**

Run: `bun --cwd beskid_tracker run test src/lib/roadmap/task-display.test.ts src/components/task-display.test.tsx`

Expected: FAIL because shared rendering and target-index persistence are absent.

- [x] **Step 3: Implement the one rendering path**

Implement accessible status chroma and property visibility/order in `task-display.ts`. Cards and preview render only through `TaskDisplay`. Persist all drag moves transactionally with target index and restore optimistic state on error. Use Overview, Delivery, Specification, and Provenance tabs in a responsive `react-resizable-panels` 70/30 form/preview dialog.

- [x] **Step 4: Verify green**

Run: `bun --cwd beskid_tracker run test src/lib/roadmap/task-display.test.ts src/components/task-display.test.tsx && bun --cwd beskid_tracker run check`

Expected: PASS.

- [x] **Step 5: Commit**

```bash
git add beskid_tracker/src/lib/roadmap/task-display.ts beskid_tracker/src/components/task-display.tsx beskid_tracker/src/components/roadmap-kanban-board.tsx beskid_tracker/src/components/create-task-work-item.tsx beskid_tracker/src/server/issues.ts
git commit -m "feat(tracker): improve task display and kanban"
```

### Task 6: Website/Nexus consumption and GitHub Actions

**Files:**
- Create: `site/website/src/lib/tracker-delivery.{ts,test.ts}`
- Create: `site/website/src/lib/tracker-delivery.{ts,test.ts}`
- Modify: `site/website/src/lib/load-download-versions.ts`
- Modify: `site/website/src/components/DownloadsPage.astro`
- Modify: `beskid_nexus/gitnexus/src/server/nexus/{types.ts,spec-link-index.ts}`
- Create: `beskid_nexus/gitnexus/test/unit/tracker-delivery-link-index.test.ts`
- Create: `.github/workflows/tracker-platform-delivery.yml`
- Create: `scripts/ci/test/run-tracker-platform-delivery-tests.sh`
- Modify: `CHANGELOG.md`
- Modify: `GLOSSARY.md`

**Interfaces:**
- Consumes Task 3 delivery APIs and Task 1 catalog revision identifiers.
- Produces website download version display, Nexus typed delivery relations, and PR/main gates.

- [x] **Step 1: Write failing tests**

```ts
test("normalizes Tracker latest delivery to a download label", async () => {
  await expect(fetchLatestDelivery(fetcher)).resolves.toEqual({
    version: "0.5.0", downloadLabel: "Beskid 0.5.0",
  });
});
```

Create a shell contract test that fails when the workflow omits strict OpenSpec validation, projection/reconciliation validation, Tracker tests, Platform Spec tests, or latest-delivery validation.

- [x] **Step 2: Verify red**

Run: `bun --cwd site/website run test src/lib/tracker-delivery.test.ts; bash scripts/ci/test/run-tracker-platform-delivery-tests.sh`

Expected: FAIL because consumer/workflow do not exist.

- [x] **Step 3: Implement consumers and gates**

Read one API base URL environment variable and visibly reject malformed latest-version payloads. Ingest Tracker nodes/edges in Nexus keyed by Tracker ID plus catalog revision. Add PR/main workflow jobs for strict OpenSpec validation, deterministic catalog/projection report, Tracker test/check, Platform Spec test/typecheck, website test/build, Nexus focused test, and shell contract; upload reports as artifacts and do not deploy/mutate external data.

- [x] **Step 4: Verify green and completion gate**

Run: `bash scripts/ci/test/run-tracker-platform-delivery-tests.sh && bun --cwd site/website run test src/lib/tracker-delivery.test.ts && bun --cwd site/website run build && bun run openspec:validate && bun --cwd beskid_tracker run test && bun --cwd site/platform-spec run test && bun --cwd site/platform-spec run typecheck && node .gitnexus/run.cjs detect-changes --scope compare --base-ref main`

Expected: PASS; change detection is limited to Tracker, Platform Spec, Website, Nexus, OpenSpec, and CI integration.

- [x] **Step 5: Commit**

```bash
git add site/website beskid_nexus .github/workflows/tracker-platform-delivery.yml scripts/ci/test/run-tracker-platform-delivery-tests.sh CHANGELOG.md GLOSSARY.md
git commit -m "feat: integrate tracker delivery across web services"
```

## Plan Self-review

- Tasks 1–4 implement authority, PR synchronization, catalog relations, reconciliation, history backfill, and delivery API.
- Task 5 implements the requested configurable chroma, persisted kanban ordering, tabs/groups, and 70/30 dialog preview.
- Task 6 implements Website/Nexus links and GitHub Actions verification.
- The names `TrackerSpecLink.standardId`, `catalogRevision`, and the delivery API are consistent across all tasks.
