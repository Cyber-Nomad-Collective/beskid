---
title: "beskid repl"
description: "Evaluate snippets in an interactive JIT session."
---

`beskid repl` starts the current interactive snippet evaluator. The REPL uses the JIT engine and does not resolve a project in this version.

Use `--plain` for line-oriented standard input and output. Otherwise, a terminal starts the interactive interface. Enter `:quit` or send end-of-file to stop the plain session.

```bash
beskid repl --plain
```

Do not use the REPL result as evidence for the AOT behavior of `beskid run`. See [Build, run, and test](/docs/tooling/build-run-test/).

[← Back to CLI command reference](/book/reference/cli/command-reference/)
