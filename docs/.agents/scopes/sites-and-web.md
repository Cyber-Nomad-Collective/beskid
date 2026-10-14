# Scope: sites and shared web

Public websites, the auth hub, the learning app and the shared TypeScript
packages they use.

## Parts

| Path | What it is | License |
| --- | --- | --- |
| `site/website/` | Astro + Starlight: landing, Beskid Docs, the Book, the blog | AGPL-3.0-only (app), CC-BY-4.0 (prose) |
| `site/auth/` | Shared GitHub OAuth hub for Tracker, Nexus and pckg | AGPL-3.0-only |
| `site/learn/` | Interactive learning app with a compiler-backed check endpoint | AGPL-3.0-only |
| `beskid_web_common/` (submodule) | Shared TS: `trudoc`, `@beskid/beskid-ui`, `@beskid/ui-react`, auth client | Apache-2.0 |
| `beskid_sites/apps/` | Deployable app sources (website, pckg web, shell template) | see `LICENSING.md` |

Browser identity for services is provided by Authentik's proxy outpost (see
"Authentik" in `GLOSSARY.md`).

## Package manager and packages

- **pnpm** for every site app and at the root.
- `@beskid/*` packages are published on GitHub Packages. Do not use monorepo
  `file:` links for them. Pin `^0.2.0`. Refresh with
  `./scripts/sync-beskid-packages.sh`.
- Private `@beskid/*` packages may need `NODE_AUTH_TOKEN`. Without it the
  preflight reports a skip, not a pass.
- While a site still resolves `@beskid/*` through
  `file:../../beskid_web_common`, CI and Docker must check out or copy that
  submodule before `pnpm install`, the same way the website image does.

## Commands

| Task | Command |
| --- | --- |
| Website dev server | `pnpm website` (root) |
| Website build | `pnpm --cwd site/website run build` |
| Learn | `just learn-deps`, then `just learn` |
| Shared UI tests | `pnpm test:shared-ui` |
| Site build gate | `scripts/ci/site-build-gate.sh` |

## UI conventions

- Match the existing Fluent Blazor and `@beskid` component patterns.
- The hub launcher is the leftmost item in navigation bars.
- Settings and kanban dialogs: use structural tabs or groups. A settings shell
  has a navigation tree on the left and an auto-rendered form on the right.
  Task dialogs are about 70% form and 30% preview.
- The shared AST/DAG explorer (ReactFlow, d3) belongs in common `@beskid`
  components. Website, pckg and Tracker reuse one repository/browser explorer
  dialog.

## Domains

Public browser and API origins use standard HTTPS. Staging hosts use the `stg-`
prefix. Deployment target URLs are covered in
[build-release-infra.md](build-release-infra.md).
