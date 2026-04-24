---
title: "Package Client CLI"
description: "Registry tooling: implemented `beskid pckg` client and the planned `beskid pkg` model."
---

## Implemented client: `beskid pckg`

The compiler ships a **pckg** HTTP client as `beskid pckg …`. It covers packing (`.bpk`), publishing to the registry, API-key configuration, catalog search, downloads, and yank/unyank.

Authoritative flag and workflow documentation lives on the CLI site page: **[beskid pckg](/guides/cli/commands/pckg/)**.

Publish flow in practice:

1. **`beskid pckg pack`** — materializes API docs under `<source>/.beskid/docs/`, writes `package.json` + `checksums.sha256` into a `.bpk`, and prints `Resolved package version: …` (the version embedded in that artifact).
2. **`beskid pckg upload <package> --artifact …`** — does **not** take `--version` and does **not** send multipart `version`. The registry assigns the next semantic version (default bump: **patch** over the latest non-yanked release). On success the CLI prints `PCKG_PUBLISHED_VERSION=<semver>` for scripts and CI, plus a human-readable summary.

Other subcommands that refer to an existing release (`download`, `yank`, `unyank`) still require `--version`.

Failures from `beskid pckg` exit non-zero; the Beskid CLI surfaces errors as a diagnostic report (miette) on stderr.

## Planned unified model: `beskid pkg`

The following describes the **target** `beskid pkg` surface (auth, dependency graph, and a single `publish` entrypoint). It is **not** yet the implemented path for registry uploads; use **`beskid pckg pack` / `beskid pckg upload`** until `pkg publish` lands.

### Command groups

- `beskid pkg login`
- `beskid pkg whoami`
- `beskid pkg search <query>`
- `beskid pkg add <id>[@range]`
- `beskid pkg remove <id>`
- `beskid pkg install`
- `beskid pkg publish [--dry-run]`
- `beskid pkg yank <id> <version>`
- `beskid pkg unyank <id> <version>`

### Auth flow (planned)

`login` exchanges user credentials or API key for a scoped token stored in the local CLI credentials store. `whoami` validates current token and returns account role metadata (`User`, `Publisher`, `SuperAdmin`).

### Dependency workflow (planned)

1. `pkg add` updates `Project.proj` dependency block.
2. `pkg install` resolves + downloads dependencies.
3. `Project.lock` is synchronized and integrity fields are persisted.
4. `pkg remove` updates both manifest and lock on next install/update.

### Publish workflow (planned)

1. `pkg publish --dry-run` validates package structure and metadata locally.
2. `pkg publish` creates deterministic `.bpk` and uploads it.
3. Server returns accepted/rejected diagnostics with machine-readable codes.

### Exit and diagnostics policy (planned)

- Non-zero exit codes for resolver, auth, transport, or validation failures.
- Structured stderr with diagnostic code prefixes (example: `E30xx`, `PCKG4xx`).
- Human + JSON output modes for CI consumption.
