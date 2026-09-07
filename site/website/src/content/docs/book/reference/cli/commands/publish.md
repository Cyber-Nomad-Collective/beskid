---
title: "beskid publish"
description: "Build release artifacts for the current package target and exit with packed outputs."
---

Build and compile release artifacts for resolved project targets with plain step logs.

`beskid publish` is a convenience façade over `beskid dev build compile` that forces `--release` and disables spinner/overlay output.

## Usage

```bash
beskid publish [INPUT]
```

`INPUT` resolves the same way as other project-aware build commands (`--project`, `--target`, and `--workspace-member` flags are accepted when needed).

## Behavior

- Force-sets `--release`.
- Force-sets plain line-step progress (`[1/4] ...`).
- Reuses the same resolve/build pipeline as compile.
- Exits non-zero on build failure.

## Example

```bash
beskid publish --project ./Project.proj
```

[← Back to CLI command reference](/book/reference/cli/command-reference/)
