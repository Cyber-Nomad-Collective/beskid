# Tracker, Platform Spec, and Delivery Integration Design

## Goal

Make Tracker the operational authority for Beskid versions and delivery work while
keeping OpenSpec the sole normative authority. Platform Spec remains in its current
directory shape and becomes the GitHub-authorized OpenSpec collaboration surface.
The website and Nexus consume shared version and cross-link contracts rather than
reconstructing release state.

## Authority Boundaries

| Concern | Owner | Stored authority | Consumers |
| --- | --- | --- | --- |
| Normative requirements and capability text | OpenSpec | `openspec/specs/**/spec.md` | Platform Spec, Tracker, Nexus, Book |
| Catalog identifiers, aliases, and revision | OpenSpec build | `openspec/catalog.json` | Platform Spec, Tracker, Nexus |
| Domain, area, and feature presentation | Platform Spec | existing Platform Spec reader/editor model projected from catalog | users and embeds |
| Delivery versions, workstreams, tasks, task state, and Git provenance | Tracker | Tracker SQLite plus checked-in `beskid_tracker/data/` seed | Website, Platform Spec, Nexus, CI |
| Public bugs | GitHub Issues plus Tracker bug records | existing bug-only integration | Tracker and cross-link consumers |

Platform Spec does not create a parallel specification directory or database. Its
edits are translated to OpenSpec changes, reviewed through GitHub, then rendered
from the resulting catalog revision. Tracker never mirrors roadmap tasks to GitHub.

## PR-backed OpenSpec Collaboration

1. A signed-in Platform Spec editor begins an edit batch from a catalog revision.
2. The server validates the proposed domain/area/feature and requirement changes
   against the current catalog and OpenSpec structural rules.
3. It creates a branch named `platform-spec/<user>/<batch-id>` through the user's
   GitHub authority, writes the OpenSpec change files, and opens a PR.
4. Tracker records a read-only link to the proposed capability/requirement IDs,
   PR URL, source revision, target revision (when merged), and relation type.
5. GitHub Actions validates OpenSpec, regenerates the catalog, checks projection
   determinism, and publishes PR status back to Platform Spec.
6. After merge, a catalog refresh event updates Platform Spec and Tracker link
   metadata. A ledger keyed by `PR number + source revision + target revision`
   makes retries idempotent and prevents reverse-sync echo loops.

OpenSpec-originated changes follow the reverse half of the same protocol: catalog
generation emits the new revision; Platform Spec refreshes its existing view; and
Tracker validates or marks stale only its links, never changes normative text.

## Tracker Delivery Model and Backfill

Tracker is the only public version endpoint. Each version has a SemVer identifier,
status, release visibility, published-at timestamp, and catalog revision. Each task
belongs to exactly one version and one workstream; it may reference one or more
stable OpenSpec capability or requirement IDs, each with the catalog revision used
when linked.

The deterministic history-backfill command reads a reviewed version-band ledger
(superrepo/submodule commit ranges, source repositories, and OpenSpec revision),
groups commits into configured workstreams, and emits a proposal. It assigns a
confidence level and an explicit unmapped bucket; it never silently invents links.
After human approval, a transaction applies the proposal, preserving commit ranges
and task provenance. Existing hand-authored `data/` remains a bootstrap/export
artifact; the reconciliation command has dry-run, apply, and stale/conflict modes.

## Cross-site APIs and Navigation

Tracker exposes a versioned public API:

- `GET /api/v1/delivery/latest` returns the single public latest SemVer version,
  release status, canonical Tracker URL, and catalog revision.
- `GET /api/v1/delivery/versions/:version` returns workstreams, task summaries,
  OpenSpec relation IDs, and provenance links.
- `GET /api/v1/links/:target` resolves a task, capability, requirement, bug, or
  Nexus entity into typed canonical links.

Platform Spec adds task creation and task-list embeds scoped to existing
domain/area/feature routes. It sends only stable OpenSpec identifiers to Tracker.
Nexus ingests the versioned Tracker delivery feed and catalog revision, allowing
typed links among requirements, tasks, bugs, Git commits, and implementation
symbols. The main website download surface resolves its public version only from
Tracker's latest-version API; CI reads the same endpoint or a checked-in generated
delivery manifest with an identical schema.

## Tracker UX

The workstream kanban board retains its existing routes but receives one canonical
task-display configuration shared by cards and preview. It supports configurable
property visibility and ordering, status chroma with accessible contrast, persisted
same-column ordering, optimistic cross-column moves with rollback, and keyboard
drag operations.

Create/edit dialogs use tabs for Overview, Delivery, Specification, and Provenance.
Each tab groups related controls and uses a 70/30 resizable split: the form occupies
70 percent and a live task preview occupies 30 percent. The preview consumes the
same task-display configuration as kanban cards, eliminating duplicate hard-coded
rendering logic.

## Error Handling and Security

- A Platform Spec edit requires an authenticated GitHub identity with verified
  repository write access; no service token impersonates the user.
- Branch/PR creation is idempotent by edit-batch id. Existing open PRs are updated
  rather than duplicated.
- Catalog revision drift returns a structured conflict with reload/rebase actions;
  the service never auto-merges normative conflicts.
- Tracker relation writes reject unknown OpenSpec IDs, stale catalog revisions, or
  a workstream outside the selected version.
- Backfill apply rejects an unreviewed proposal digest, incomplete commit range,
  or duplicate provenance range.
- Failed GitHub webhooks/events are retried from an idempotent outbox and surfaced
  in Platform Spec/Tracker administrative health views.

## Verification and GitHub Actions

The implementation must add focused unit and integration tests for projection,
catalog revision conflict handling, PR idempotency, task relation validation,
delivery API contracts, workstream membership, backfill proposals, dialog preview,
and kanban ordering. GitHub Actions must run the affected Bun test suites,
OpenSpec strict validation, deterministic catalog/projection checks, generated
manifest comparison, and public latest-version contract validation on pull requests
and main. No deployment or external PR is performed by these tests.

## Delivery Slices

1. Define OpenSpec deltas and stable Tracker/platform synchronization contracts.
2. Implement Platform Spec GitHub PR adapter and catalog-refresh ledger.
3. Implement Tracker data migrations, OpenSpec link relations, version public API,
   reconciliation, and history backfill.
4. Implement Platform Spec task embeds and Nexus/website consumption of delivery
   links/latest version.
5. Implement shared Tracker task-display model and kanban/dialog UX.
6. Add GitHub Actions gates, integration fixtures, and end-to-end verification.

## Explicit Non-goals

- Reorganizing Platform Spec directories or adding a second normative source.
- Mirroring non-bug Tracker tasks to GitHub Issues.
- Automatically assigning ambiguous historic commits to a workstream or spec link.
- Changing external repository permissions, secrets, or protected-branch policy.
