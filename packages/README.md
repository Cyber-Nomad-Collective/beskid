# Shared web packages

Vendored copies under `packages/trudoc` and `packages/beskid-docs-ui` were removed.

**Source of truth:** [beskid_web_common](https://github.com/Cyber-Nomad-Collective/beskid_web_common) (git submodule at `beskid_web_common/`).

**Consumption:**

| Context | How |
|---------|-----|
| Superrepo dev | Bun workspaces link `beskid_web_common/packages/*` (see root `package.json`). |
| CI (this repo) | Checkout with `submodules: recursive` + `bun install`; optional GitHub Packages via `.npmrc` and `NODE_AUTH_TOKEN`. |
| Published apps | `npm:@cyber-nomad-collective/trudoc` and `npm:@cyber-nomad-collective/docs-ui` from [GitHub Packages](https://github.com/orgs/Cyber-Nomad-Collective/packages?repo_name=beskid_web_common). Site uses npm aliases `trudoc` and `@beskid/docs-ui`. |

Local install without a PAT: `git submodule update --init beskid_web_common` then `bun install` at the repo root.
