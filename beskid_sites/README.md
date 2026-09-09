# beskid_sites

This standalone pnpm workspace contains the consolidated TanStack Start website,
its reusable shell, and the canonical production runtime under `deploy/`.
AppVeyor publishes the five Beskid application images to
`cr.beskid-lang.org`; Watchtower alone reconciles their controlled production
tags.

The workspace consumes the canonical React component library directly from
`beskid_web_common/packages/beskid-ui-react`. It does not carry copied tracker,
Nexus, pckg, standard-reader, UI-library, registry, or deployment implementations.

## Layout

```
beskid_sites/
  package.json
  pnpm-workspace.yaml
  packages/shell-core/     # shared TanStack shell and authentication primitives
  apps/shell-template/     # reference host for shell-core
  apps/website/            # consolidated website and documentation implementation
  deploy/                  # standalone production Compose, registry, and Watchtower
```

## Install and verify

From this directory, with the root `beskid_web_common` submodule initialized:

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm check
pnpm --dir apps/website build
```

The production source paths remain those listed in the root `AGENTS.md` until
this workspace passes its release gates and is promoted by an explicit
specification change.
