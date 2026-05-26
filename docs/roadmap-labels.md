# Roadmap GitHub labels

The [Beskid Tracker](https://github.com/Cyber-Nomad-Collective/beskid/tree/main/beskid_tracker) app maps kanban columns, delivery versions, workstreams, and platform-spec scope to labels on **Cyber-Nomad-Collective/beskid** issues. Issue bodies store structured spec relations in a `roadmap-spec` fenced JSON block.

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

Issues without a status label appear in **Backlog**. Dragging a card updates labels via the GitHub API.

## Priority

| Label | UI badge |
|-------|----------|
| `roadmap/priority/high` | High |
| `roadmap/priority/medium` | Medium |
| `roadmap/priority/low` | Low (default when no priority label) |

## Delivery version

Each roadmap issue belongs to exactly one delivery band:

| Label | Meaning |
|-------|---------|
| `roadmap/version/v0.1` | v0.1 delivery |
| `roadmap/version/v0.2` | v0.2 delivery |
| `roadmap/version/v0.3` | v0.3 delivery |
| `roadmap/version/v0.4` | v0.4 delivery |

The kanban board at `/v/v0.2` (for example) lists open issues with the matching version label. Only the **repository owner** (or org admin) can register additional `roadmap/version/*` labels from the UI.

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
