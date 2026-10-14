# Multi-agent work

How several agents work in Beskid at once without stepping on each other.
These are upstream maintainer preferences unless marked otherwise.

## Splitting the work

- Large work that touches several surfaces goes to parallel agents, one slice
  each, in isolated git worktrees or branches.
- Write scopes must not overlap.
- Serialize only for the final integration, when merge and revert loops start.

## Tools

- For parallel work in Cursor, prefer Cursor Auto agents. Do not use Composer
  2.5 Fast when Auto is available.

## Ownership labels (Linear)

- Respect ownership labels: `agent/cursor` and `agent/codex`.
- A Cursor agent may create Cursor child issues under a Codex parent. It does
  not relabel or close the parent.
- When a fact needed for the work lies outside your exclusive scope, file a
  blocker for the owning agent. Do not expand into crates another agent owns.

## Domain knowledge files

Earlier sessions kept per-domain knowledge outside the repository, under
`~/.agents/knowledge/` on the maintainer's machine. These files are never
committed or pushed.

| Domain | Paths | Knowledge file |
| --- | --- | --- |
| Standard and docs | `openspec/`, `site/website/`, `docs/` | `spec-docs.md` |
| Tracker and Nexus | `beskid_tracker/`, `beskid_nexus/`, shared package APIs | `apps-integration.md` |
| Build, release, infrastructure | `.github/`, `scripts/ci/`, `beskid_infra/` | `cicd.md` |
| Compiler and runtime | `compiler/` | `compiler.md` |
| ABI contracts | `compiler/runtime_manifest.bsol`, ABI model | `abi-v5.md` |
| pckg migration | `pckg/`, `compiler/crates/beskid_pckg_*`, `site/auth/` | `pckg-*.md` |

`docs/.agents/` is the shared, in-repository counterpart for knowledge that is
safe to publish.
