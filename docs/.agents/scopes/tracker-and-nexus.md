# Scope: Tracker and Nexus

Two applications that sit next to the language: the Tracker decides delivery,
and Nexus shows the code and the standard as a graph.

## Tracker

- Submodule `beskid_tracker/`, served at <https://tracker.beskid-lang.org>.
  TanStack Start, AGPL-3.0-only.
- **Its SQLite database is the source of truth for task tracking and delivery.**
  Delivery means which version ships what.
- GitHub synchronization is limited to the active version and to public bugs.
  Feature requests and roadmap items belong in the Tracker, not in GitHub
  Issues.
- Seed workstreams from `beskid_tracker/data/` and from OpenSpec.
- Tests: `pnpm test:tracker`; typecheck: `pnpm typecheck:tracker`.

## Tracker and OpenSpec

- OpenSpec is the normative authority for what the rules are.
- The Tracker is the authority for delivery and versions. It links to
  revisioned catalog entries, shows the latest public delivery, and reconciles
  with the catalog without overwriting it.

## Nexus

- Submodule `beskid_nexus/`: an interactive graph explorer over code,
  documents and the standard, with an MCP endpoint at `/api/mcp`.
- It is a fork of GitNexus and stays under the PolyForm Noncommercial License
  1.0.0. It cannot be relicensed as AGPL without upstream permission.
- Tests: `pnpm test:nexus:unit`, `pnpm test:nexus:e2e`, and
  `pnpm gate:shared-ui-nexus` for the shared UI with Nexus gate.

## Shared explorer UI

Tracker, website and pckg reuse one explorer dialog from the shared `@beskid`
components. See [sites-and-web.md](sites-and-web.md).
