---
title: "beskid graph"
description: "Render project and workspace graphs as Mermaid."
---

`beskid graph` resolves a project context and renders a `project`, `workspace`, `module`, `imports`, or `host` graph.

```bash
beskid graph --project ./App.bproj --kind project --mermaid
```

Use `--out <path>` to write Mermaid text to a file. Use `--mermaid` for standard output or `--tui` to force the terminal renderer. Project resolution also accepts `--locked`, `--frozen`, `--target`, and `--workspace-member`.

[← Back to CLI command reference](/book/reference/cli/command-reference/)
