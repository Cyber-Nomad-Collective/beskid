---
title: "beskid pckg"
description: "Package registry and publishing operations (pckg backend)."
---

Dispatches to the **pckg** client: authentication, dependency installation, search, publish, yank/unyank, and related registry workflows.

## Automatic docs on pack

`beskid pckg pack` always generates API docs before creating the `.bpk` artifact:

- writes docs to `<source>/.beskid/docs/`
- includes generated `api.json` and `index.md` in the packed artifact

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
