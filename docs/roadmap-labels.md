# Roadmap GitHub labels

The [Beskid Roadmap](https://github.com/Cyber-Nomad-Collective/beskid/tree/main/beskid_roadmap) app maps kanban columns and priorities to labels on **Cyber-Nomad-Collective/beskid** issues.

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

## Optional area

Use `roadmap/area/<name>` (for example `roadmap/area/compiler`, `roadmap/area/docs`) for filtering in future roadmap views.

## Setup

From the superrepo root (requires [GitHub CLI](https://cli.github.com/) and `repo` scope):

```bash
bash beskid_roadmap/scripts/setup-github-labels.sh
```

## Platform specification links

In issue bodies, link spec pages with:

- Markdown: `[Compiler](/platform-spec/compiler/)` or full `https://beskid-lang.org/platform-spec/...` URLs
- Marker line: `Spec: /platform-spec/compiler/build-pipeline/`

The roadmap UI parses these and shows chips linking to [beskid-lang.org](https://beskid-lang.org/platform-spec/).
