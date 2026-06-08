# Roadmap GitHub labels

Canonical copy lives at [`beskid_tracker/docs/roadmap-labels.md`](../beskid_tracker/docs/roadmap-labels.md). This file is restored at the superrepo root for cross-repo discoverability (removed during auth refactor `510f302`).

The [Beskid Tracker](https://github.com/Cyber-Nomad-Collective/beskid/tree/main/beskid_tracker) app maps kanban columns, workstreams, and platform-spec scope to labels on **Cyber-Nomad-Collective/beskid** issues. **Delivery versions** use [GitHub Milestones](https://docs.github.com/en/issues/using-labels-and-milestones-to-track-work/about-milestones) (milestone title = `v0.2`, etc.). Issue bodies store structured spec relations in a `roadmap-spec` fenced JSON block.

## Public bugs

| Label | Meaning |
|-------|---------|
| `bug` | Shown on the public bug tracker at [tracker.beskid-lang.org](https://tracker.beskid-lang.org/bugs). Distinct from `roadmap/*` planning labels. |

The tracker mirrors issues in SQLite (`bun run sync:issues` or automatic background sync). Configure `GITHUB_SYNC_TOKEN` or `GITHUB_PUBLIC_READ_TOKEN` on the server so sync is not rate-limited. Anonymous UI reads use the mirror, not live GitHub pagination.

## Status (kanban column)

| Label | Column |
|-------|--------|
| `roadmap/status/backlog` | Backlog |
| `roadmap/status/in-progress` | In Progress |
| `roadmap/status/done` | Done |

Issues without a status label appear in **Backlog**. Closed issues without a status label appear in **Done**. Dragging a card updates labels and GitHub issue state: **Done** closes the issue; moving out of **Done** reopens it.

## Priority

| Label | UI badge |
|-------|----------|
| `roadmap/priority/high` | High |
| `roadmap/priority/medium` | Medium |
| `roadmap/priority/low` | Low (default when no priority label) |

## Delivery version (GitHub Milestone)

Each roadmap issue belongs to exactly one delivery band via a **GitHub Milestone** whose title is the version id (`v0.1`, `v0.2`, …). The kanban board at `/v/v0.2` lists issues assigned to the `v0.2` milestone. Only the **repository owner** (or org admin) can register additional delivery versions from the UI (creates the milestone if missing).

**Legacy:** Older issues may still carry `roadmap/version/*` labels. The tracker reads those labels as a fallback when no version milestone is set. New issues and imports should use milestones only—not `roadmap/version/*` labels.

| Legacy label | Meaning |
|--------------|---------|
| `roadmap/version/v0.1` | v0.1 (fallback only) |
| `roadmap/version/v0.2` | v0.2 (fallback only) |
| `roadmap/version/v0.3` | v0.3 (fallback only) |
| `roadmap/version/v0.4` | v0.4 (fallback only) |

## Workstream

| Label | Meaning |
|-------|---------|
| `roadmap/workstream/<slug>` | Groups issues within a version for the workstreams dashboard |

## Platform-spec scope (from primary required relation)

When an issue links a platform-spec node, the compiler derives hierarchy labels for filtering:

| Label | Meaning |
|-------|---------|
| `roadmap/domain/<slug>` | Platform-spec domain |
| `roadmap/area/<slug>` | Platform-spec area |
| `roadmap/feature/<slug>` | Platform-spec feature |

## Spec approval

| Label | Meaning |
|-------|---------|
| `roadmap/spec-approval/pending` | Spec relations await owner approval |
| `roadmap/spec-approval/approved` | Owner approved spec linkages |

Only the repository owner can move an issue from pending to approved (does not edit beskid-lang.org content).

## Setup

From the superrepo root (requires [GitHub CLI](https://cli.github.com/) and `repo` scope):

```bash
bash beskid_tracker/scripts/setup-github-labels.sh
```

## Platform specification relations

Issue bodies include a fenced block:

````markdown
```roadmap-spec
{
  "relations": [
    {
      "path": "/platform-spec/compiler/...",
      "href": "https://beskid-lang.org/platform-spec/compiler/...",
      "title": "…",
      "level": "feature",
      "relation": "implements",
      "required": true
    }
  ]
}
```
````

Supported `relation` values: `implements`, `depends-on`, `tracks`, `extends`, `validates`. At least one relation should be marked `required`. The UI shows metadata (title, level, relation type) and links to [beskid-lang.org](https://beskid-lang.org/platform-spec/).

The spec picker loads navigation metadata from the docs site (no copy step in roadmap deploys):

`https://beskid-lang.org/generated/platform-spec-nav-tree.json`

That file is written on each `site/website` prebuild/deploy alongside `src/generated/platform-spec-nav-tree.json`.

Legacy body markers (`Spec: /platform-spec/...`) and markdown links are still merged when present.

## Subtasks (GitHub task lists)

Roadmap tasks can include a checklist rendered natively on GitHub and mirrored in the tracker UI. The issue body stores:

1. A human-readable `### Subtasks` section using GitHub task-list syntax (`- [ ]` / `- [x]`).
2. A machine-readable fence for stable row ids and round-trip editing:

````markdown
### Subtasks

- [x] Wire API handler
- [ ] Add regression test

```roadmap-subtasks
{
  "items": [
    { "id": "…", "text": "Wire API handler", "done": true },
    { "id": "…", "text": "Add regression test", "done": false }
  ]
}
```
````

The tracker prefers the `roadmap-subtasks` fence when present; otherwise it parses the checklist section. Empty checklists omit both blocks.
