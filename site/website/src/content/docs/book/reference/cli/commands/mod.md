---
title: "beskid mod"
description: "Build and remove compiler Mod AOT artifacts."
---

`beskid mod rebuild [PROJECT]` builds the cached AOT artifact for a Mod project. `beskid mod clean [PROJECT]` removes that cache.

```bash
beskid mod rebuild ./mods/MyMod --locked --plain
beskid mod clean ./mods/MyMod --plain
```

The project argument can be a Mod directory, a `.bproj` manifest, or a `.bws` manifest. `rebuild` also accepts `--clean`, `--frozen`, and `--target-triple`.

[← Back to CLI command reference](/book/reference/cli/command-reference/)
