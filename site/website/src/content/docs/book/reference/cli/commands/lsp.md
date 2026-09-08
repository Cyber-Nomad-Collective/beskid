---
title: "beskid lsp"
description: "Run or install the Beskid language server."
---

`beskid lsp` starts the language server on standard input and output. It uses the managed binary when one is installed. Otherwise, it starts the server in the current CLI.

```bash
beskid lsp install
beskid lsp install --release-tag lsp-v0.4.0
```

The install operation writes the managed server under `~/.beskid/bin`. The default release tag is `lsp-stable`. For editor selection, verification, and recovery, use the [Editor setup procedure](/docs/getting-started/editor/).

[← Back to CLI command reference](/book/reference/cli/command-reference/)
