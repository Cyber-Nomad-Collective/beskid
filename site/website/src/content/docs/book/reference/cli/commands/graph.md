---
title: "beskid graph"
description: "Render project and workspace graphs as Mermaid."
---

`beskid graph [INPUT]` resolves an optional source or project context and renders a `project`, `workspace`, `module`, `imports`, or `host` graph.

```bash
beskid graph Src/Main.bd --project ./App.bproj --kind project --mermaid --plain
```

Use `--out <path>` to write Mermaid text to a file. Use `--mermaid` for standard output or `--tui` to force the terminal renderer. Use `--plain` to disable resolve progress. Project resolution also accepts `--project`, `--locked`, `--frozen`, `--target`, and `--workspace-member`. The default `--kind` is `project`.

[← Back to CLI command reference](/book/reference/cli/command-reference/)
