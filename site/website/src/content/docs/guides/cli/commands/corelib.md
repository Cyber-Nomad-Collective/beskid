---
title: "beskid corelib"
description: "Materialize the embedded Beskid corelib project template."
---

Copies the **embedded corelib** project template (bundled with the CLI at build time) to a destination directory so you can open, edit, or depend on it as a normal Beskid project.

## Arguments

| Argument | Description |
| --- | --- |
| `--output` | Destination directory (default `corelib/beskid_corelib`) |

## Notes

- If the destination is the same as the bundled template location, the command reports the path and exits without copying.
- The superrepo and compiler docs describe submodule layout for the canonical `compiler/corelib/beskid_corelib` tree; the **pckg** package id is **`corelib`**. Override sources in development with `BESKID_CORELIB_SOURCE` when needed.

## Example

```bash
beskid corelib --output ./vendor/beskid_corelib
```

[← Back to CLI command reference](/guides/cli/command-reference/)
