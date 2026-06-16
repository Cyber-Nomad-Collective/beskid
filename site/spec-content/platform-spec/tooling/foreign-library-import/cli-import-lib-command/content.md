---
title: beskid import lib command
description: CLI workflow for mapping foreign libraries into Project.proj link
  metadata (v0.3).
specLevel: feature
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-05-20
---

## Command (reserved name)

```bash
beskid import lib <logical> [options]
```

Exact spelling may alias `beskid link import` in implementation; platform-spec reserves **`import lib`** as the user-facing verb.

## Responsibilities

The command **must**:

1. Accept a **logical library** string matching or intended for `Extern` `Library` fields.
2. Select an **`ExternalLibrary`** provider for the current host (default **`c-posix`** on tier-1).
3. Emit or update **`project.link`** manifest entries (see **[project link libraries](/platform-spec/tooling/manifests-and-lockfiles/project-manifest-contract/project-link-libraries/)**).
4. Print resolved **linker args** and **search paths** without requiring authors to hand-edit `-l` flags.

## Options (normative minimum)

| Flag | Meaning |
| --- | --- |
| `--provider <id>` | Choose `ExternalLibrary` implementation |
| `--dry-run` | Show resolution only; do not write manifest |
| `--project <path>` | Target `Project.proj` (default cwd discovery) |

## Non-goals (v0.3)

- Parsing C headers into `contract` declarations (future compiler mod / tool).
- Downloading SDKs (registry / package manager concerns).

## Security

Imported libraries **must** be subject to **`BESKID_EXTERN_ALLOW` / `BESKID_EXTERN_DENY`** at link/run drivers when those variables are set.

## Verification anchors

- **CLI surface:** `compiler/crates/beskid_cli/src/commands/import.rs` (`Commands::Import` in `cli.rs` advertises `import` in `beskid --help`).
- **Manifest mutation contract:** `compiler/crates/beskid_analysis/src/external_library/manifest_merge.rs` (idempotent merge; preserves non-`link` content).
- **End-to-end behavior:** `compiler/crates/beskid_tests/src/cli/import_lib.rs` (creates a temp `Project.proj`, runs the resolve + merge pipeline, asserts the resulting `link.libraries` round-trips through the manifest parser).
- **Closed registry rejection:** the same suite asserts unknown providers (for example `msvc`) and unknown logical names surface as structured `LibraryResolveError` values instead of panics.
