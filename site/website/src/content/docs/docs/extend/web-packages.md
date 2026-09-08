---
title: Use Shared Web Packages
description: Select, install, verify, and publish Beskid shared web packages.
pageKind: task
diagramPolicy: not-needed
diagramOmissionReason: The package identity and ownership tables are clearer than a flow diagram.
audience:
  - web developer
  - package maintainer
authority:
  status: security-sensitive
  sourceLabel: Pinned shared web package guide
  sourceHref: https://github.com/Cyber-Nomad-Collective/beskid_web_common/blob/c3957dc4b8dc8c5b1bda10c00e0717bbf364ad5e/README.md
  limits: This page explains package identity and repository gates. It does not grant package ownership or release permission.
verified:
  revision: c3957dc4b8dc8c5b1bda10c00e0717bbf364ad5e
  date: 2026-09-08
---

The `beskid_web_common` repository owns shared TypeScript packages. Select the smallest package that owns the feature.

## Prerequisites

Confirm the package owner before you change a public export. Store the GitHub Packages token in a secret manager or environment variable. Consumers need `read:packages`. Publishers need `write:packages`. Do not print, commit, copy, or put a token value in a package manifest.

pnpm is the normal package manager for the superrepo and shared-package commands. Bun appears only in the pinned component workflow for the shared-package CI and publication install. Do not apply that Bun exception to consumers.

| Published package identity | Ownership boundary |
| --- | --- |
| `@cyber-nomad-collective/trudoc` | Documentation schemas, layout, validation, and Starlight helpers. |
| `@cyber-nomad-collective/beskid-ui` | Shared Astro chrome, reader shells, and hub client. |
| `@cyber-nomad-collective/beskid-ui-react` | Shared React UI, settings, graph, and explorer components. |
| `@beskid/auth-client` | Typed Auth Hub client and handoff utilities. |
| `@cyber-nomad-collective/beskid-server-observability` | Metrics and structured logging for server applications. |

The private `@cyber-nomad-collective/eslint-config` placeholder is not a published package at the pinned revision.

## Actions

1. Choose the published package that owns the required public feature.
2. Configure both package scopes in an uncommitted `.npmrc`:

   ```ini
   @cyber-nomad-collective:registry=https://npm.pkg.github.com
   @beskid:registry=https://npm.pkg.github.com
   //npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
   ```
3. Put an `npm:` alias in the consumer manifest when existing source imports use an `@beskid/*` or legacy name.
4. Run `pnpm install` in the consumer repository.
5. Run `pnpm --dir beskid_web_common run typecheck` for an owned package change.
6. Run `pnpm --dir beskid_web_common run test` for an owned behavior change.

For example, `"@beskid/beskid-ui": "npm:@cyber-nomad-collective/beskid-ui@^0.2.0"` keeps the source import while the registry resolves the published identity.

## Expected result

The lockfile records the selected package and its published package identity. The consumer resolves the existing import alias, and the focused checks pass for the owned package.

## Recovery

If installation returns a registry error, verify the package scope and registry mapping. If the registry denies access, verify the token scope without displaying the token. Stop before publication when ownership or `write:packages` permission is absent.

## Next task

[Run the superrepo contribution workflow](/docs/contributing/superrepo-workflow/) before a cross-package change.
