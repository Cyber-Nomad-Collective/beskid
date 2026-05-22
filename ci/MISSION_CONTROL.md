# Beskid ↔ Mission Control

[Mission Control](https://github.com/MeisnerDan/mission-control) is the intended **primary UI** for prioritizing and delegating Beskid work. The superrepo stays the source of truth for code and docs; Mission Control mirrors **progress** and **agent context**.

## What Mission Control supports (and what it does not)

Mission Control is **local JSON + REST API** — not a vector database or doc CMS.

| Mechanism | Use for Beskid |
|-----------|----------------|
| **Ventures / projects** | One venture: `beskid` (`proj_gCvYQ2EyYBwK`) |
| **Goals & milestones** | North star (v0.2), docs / CI / compiler / pckg tracks |
| **Tasks** | Book pages, platform-spec features, implementation work |
| **Skills library** | Normative spec map, book map, repo layout (like trudoc indexes) |
| **`ai-context.md`** | ~650-token snapshot after `gen:context` |
| **Inbox / decisions** | Agent reports and human judgment |
| **Checkpoints** | Full JSON backup/restore of MC state |
| **Field Ops** | External actions (not used for Beskid docs) |

There is **no built-in “ingest PDF/Markdown folder”** pipeline in Mission Control. “Ingesting docs” means:

1. **Skills** — structured markdown summaries agents read every session (`POST /api/skills`, synced to `.claude/commands/` via `POST /api/sync`).
2. **Tagged tasks** — one task per spec feature or book page with `sync:book:…` / `sync:spec:…` tags for idempotent updates.
3. **`pnpm gen:context`** — compressed dashboard for agents (`data/ai-context.md`).

Third-party MCP tools (e.g. doc-ingestor, mcp-memory-service) are separate; Beskid does not need them if sync + skills cover spec/book maps.

## Cursor MCP bridge

Configure in `~/.cursor/mcp.json`:

- `MISSION_CONTROL_URL=http://127.0.0.1:3000`
- `MISSION_CONTROL_ROOT=~/mcp/mc/mission-control`

Tools: `mc_api`, `mc_context`, `mc_ensure_server`. If MCP shows errored in Cursor, the API may still work — restart the MCP server or use the sync script below.

## Sync script

From superrepo root (Mission Control must be running):

```bash
# Generate nav tree first
bun --cwd site/website run generate:platform-spec-nav-tree

# Dry run
bun ci/sync-mission-control.mjs --dry-run --all

# Apply: book pages + spec features + skills
bun ci/sync-mission-control.mjs --all
```

### What gets synced

| Source | MC representation | “Done” heuristic |
|--------|-------------------|------------------|
| `book/nav.order.json` + `.md/.mdx` | Task `[Book] …`, tag `sync:book:{slug}` | ≥80 words, ≥1 `##`, not stub/TODO |
| `platform-spec-nav-tree.json` features | Task `[Spec] …`, tag `sync:spec:{slug}` | Feature hub `status: Standard` |
| trudoc-style maps | Skills `skill_beskid_platform_spec`, `skill_beskid_book`, `skill_beskid_workspace` | Regenerated each `--skills` run |

Manual tasks (orchestration, CI triage, etc.) are **not** removed; sync only upserts tasks with `sync:*` tags.

### Remove demo / placeholder data

```bash
bun ci/cleanup-mission-control-demo.mjs
```

Keeps only the `beskid` venture, synced tasks, beskid goals, and `skill_beskid_*` / `skill_field_ops` skills.

### Environment

| Variable | Default |
|----------|---------|
| `MISSION_CONTROL_URL` | `http://127.0.0.1:3000` |
| `MC_PROJECT_ID` | `proj_gCvYQ2EyYBwK` |
| `MC_DOCS_MILESTONE_ID` | `goal_DM0t4irzSFPA` |

## Recommended workflow

1. **Human** — objectives, brain dump, decisions in Mission Control UI.
2. **Sync** — after meaningful doc commits: `bun ci/sync-mission-control.mjs --all`.
3. **Agents** — read `ai-context.md` + linked skills; pick `kanban=in-progress` tasks; run `verify:trudoc` before claiming spec work done.
4. **Optional** — `POST /api/tasks/:id/run` or venture mission for Claude Code automation.

## Aligning with `packages/trudoc/src/platform-spec/`

Trudoc owns **validation and nav-tree generation**; Mission Control owns **execution tracking**:

- `nav-tree.ts` / `load-platform-spec-nav-tree.ts` → `platform-spec-nav-tree.json` → sync creates **feature tasks** + **skill table**.
- `verify/platform-spec-content.ts` → run in CI; failures should become MC tasks or decisions, not silent drift.
- Book parity: `generate-book-nav-tree.mjs` + `verify-book-images.mjs` — same pattern as spec.

Future extensions (not implemented yet):

- Parse `verify:platform-spec-content` JSON and open tasks for PSC001 errors.
- Milestones per **domain** (6) auto-created from nav tree.
- `gh run list` → CI milestone task states.
- Submodule commit lag as `blockedBy` links.

## Links

- Mission Control UI: http://127.0.0.1:3000
- Beskid venture: http://127.0.0.1:3000/ventures/proj_gCvYQ2EyYBwK
- Objectives: http://127.0.0.1:3000/objectives
