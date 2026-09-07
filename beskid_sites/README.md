# beskid_sites

This standalone pnpm workspace contains the consolidated TanStack Start website
and its reusable shell. It is an integration candidate, not a production
deployment root: GitHub Actions continues to publish the six canonical images to
GHCR and promote them through Coolify.

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
