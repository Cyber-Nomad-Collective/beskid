---
title: "beskid pckg"
description: "Package registry and publishing operations (pckg backend)."
---

Dispatches to the **pckg** client: authentication, dependency installation, search, publish, yank/unyank, and related registry workflows.

## Automatic docs on pack

`beskid pckg pack` (via the **beskid** CLI) generates API docs before creating the `.bpk` artifact:

- writes Markdown and `api.json` to `<source>/.beskid/docs/` (for example `index.md`)
- includes those files in the published artifact (paths under `.beskid/docs/` are allowed by the registry)

On **pckg**, the in-browser documentation browser lists Markdown from:

- `docs/**/*.md` in the artifact
- optional root `README.md`
- **`.beskid/docs/**/*.md`** (same layout as Beskid pack output)

You can also ship hand-written docs under a top-level `docs/` directory in the package source; those paths are packed as usual and appear alongside generated files.

Entrypoint resolution for generation:

1. `<source>/Project.proj` (preferred)
2. `<source>/main.bd`, `<source>/src/main.bd`, or `<source>/index.bd`
3. otherwise, exactly one `.bd` file under `<source>`

If no deterministic entrypoint can be inferred, packing fails with an explicit error.

## Discovering commands

Run:

```bash
beskid pckg --help
```

for the live subcommand tree and flags.

## Conceptual documentation

For auth flows, lockfiles, and publish semantics, see the site guide [Package Client CLI](/packages/client-cli/).

## Example

```bash
beskid pckg whoami
```

[← Back to CLI command reference](/guides/cli/command-reference/)
