# Decisions — beskid_sites

## Standalone integration workspace

`beskid_sites/` is deliberately outside the root pnpm workspace. This keeps
its TanStack Start dependency graph isolated while the consolidated website is
verified against the current production implementation.

## Single shared UI authority

The only canonical React component implementation is
`beskid_web_common/packages/beskid-ui-react`. The website, shell template, and
`packages/shell-core` consume that source through a local package dependency
during the transition. No copy is kept under `beskid_sites/packages`.

## Single deployment authority

`beskid_sites/deploy` is the sole production runtime definition. Woodpecker
publishes the five Beskid application images to `cr.beskid-lang.org`; Watchtower
alone reconciles their controlled `production` tags. The runtime also owns the
private registry and joins the shared host edge, while the production operator
owns initial Compose application, secret materialization, and rollback
retagging. GitHub workflows have no platform build or deployment authority.

## Retired surfaces

The standalone platform-spec application is retired. Normative content lives in
`openspec/` and is published under `https://beskid-lang.org/docs/standard/`.
The existing `pckg`, `beskid_tracker`, and `beskid_nexus` trees remain the
single implementation authorities for their domains.
