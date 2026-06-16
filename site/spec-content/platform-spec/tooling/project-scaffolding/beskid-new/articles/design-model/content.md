---
title: Design model
description: CLI cache layout, registry integration, and option model for `beskid new`.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-05-21
---

## Purpose and scope

Tooling-side state and paths for the `beskid new` command family.

## Cache directory

| Path (under user config root) | Content |
| --- | --- |
| `templates/installed/<identity>/` | Extracted template tree + `manifest.snapshot.json` |
| `templates/git/<hash>/` | Git clone caches |
| `templates/registry-index.json` | Optional index of last-known registry versions for update checks |

Exact config root **must** match other Beskid CLI state (same resolver as `beskid pckg` auth config).

## Install record

`manifest.snapshot.json` stores:

- `identity`, `shortName`, `packageId`, `resolvedVersion`, `checksum`, `installedAt`
- `source`: `registry` \| `path` \| `git`
- `yanked`: boolean snapshot at install time

## Update check

On `beskid new <shortName>` (and `--package`):

1. Read installed `resolvedVersion`.
2. Query registry for latest non-yanked version.
3. If newer: print update message (non-fatal).
4. If current is yanked: print warning (see contracts).

## Online vs offline

| Mode | Behavior |
| --- | --- |
| Registry reachable | Prefer download of `beskid.templates.*`; update check enabled |
| Offline | Use cache only; `list` shows installed; warn if update check skipped |

## Exit codes

| Code | Meaning |
| --- | --- |
| 0 | Success |
| 1 | User error (validation, collision) |
| 2 | Engine or I/O failure |
| 3 | Registry auth or network failure when required |

## Code anchors

- `compiler/crates/beskid_cli/src/cli.rs` — subcommand registration
- `compiler/crates/beskid_pckg` — download API
