# beskid_sites

Standalone pnpm workspace for the next generation of Beskid site apps (TanStack Start + React 19), sharing the `@cyber-nomad-collective/beskid-ui-react` component library.

This directory lives inside the Beskid monorepo working tree but is **not** a member of the root `pnpm-workspace.yaml` and is **not** a git submodule. It has its own workspace config, catalogs, Biome config, and tsconfig base. See [DECISIONS.md](./DECISIONS.md) for the rationale and the DRY decision on the shared React library.

## Layout

```
beskid_sites/
  package.json            # workspace root (private, no runtime deps)
  pnpm-workspace.yaml     # packages/* + apps/*, catalogs: tanstack-start, react
  tsconfig.base.json      # ES2022 / bundler / react-jsx / strict
  biome.json              # self-contained, mirrors root biome.json
  .npmrc                  # package-manager-strict + auto-install-peers (no registry config)
  .gitignore
  packages/
    beskid-ui-react/      # canonical shared React shadcn library (copied from beskid_web_common)
  apps/
    .gitkeep              # TanStack Start site apps land here (added by other agents)
```

## Install

```bash
pnpm install
```

All dependencies resolve from the public npm registry. No GitHub Packages auth is required because the shared library has no `@beskid/*` or `@cyber-nomad-collective/*` runtime dependencies.

## Verify the shared library

```bash
pnpm -C packages/beskid-ui-react typecheck   # tsc --noEmit
pnpm -C packages/beskid-ui-react test        # vitest run
pnpm run check                                # biome check (workspace-wide)
```

## Add a site app

A TanStack Start shell template will be added under `apps/` by a later agent. Once it exists, scaffold new services from it and depend on the shared library via a workspace link:

```jsonc
// apps/<service>/package.json
{
  "dependencies": {
    "@cyber-nomad-collective/beskid-ui-react": "workspace:*",
    "@tanstack/react-router": "catalog:tanstack-start",
    "@tanstack/react-start": "catalog:tanstack-start",
    "react": "catalog:react",
    "react-dom": "catalog:react"
  }
}
```

Each service also gets its own `Plan.md` describing its scope, routes, and shared-component usage.

## Consume the shared library

```ts
import { Button, BeskidHub, RepoExplorerDialog } from "@cyber-nomad-collective/beskid-ui-react";
import "@cyber-nomad-collective/beskid-ui-react/styles/shadcn-entry.css";
```

Graph viewers additionally require the ReactFlow stylesheet once in the host app:

```ts
import "@xyflow/react/dist/style.css";
```
