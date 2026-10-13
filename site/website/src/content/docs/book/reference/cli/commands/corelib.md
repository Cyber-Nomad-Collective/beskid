---
title: "beskid dev corelib"
description: "Materialize the embedded Beskid corelib project template."
---

Copies the **embedded Corelib workspace** (bundled with the CLI at build time) to a destination directory so you can open, edit, or depend on it. The copy holds the `.bws` workspace manifest and every member, including the Mods under `mods/`.
This command is available as `beskid dev corelib`.

## Arguments

| Argument | Description |
| --- | --- |
| `--output` | Destination directory (default `corelib`) |

## Notes

- If the destination is the same as the bundled template location, the command reports the path and exits without copying.
- The canonical sources are the `compiler/corelib` workspace; the aggregate manifest is `beskid_corelib/corelib.bproj` and the **pckg** package id is **`corelib`**. Point the CLI at a different Corelib workspace with `BESKID_CORELIB_ROOT`. `BESKID_CORELIB_SOURCE` only affects which workspace a compiler build embeds.

## Example

```bash
beskid dev corelib --output ./vendor/corelib
```

For repository setup and ownership boundaries, use [Repository setup](/docs/contributing/repository/).

[← Back to CLI command reference](/book/reference/cli/command-reference/)
