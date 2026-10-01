---
title: "beskid repl"
description: "Evaluate snippets in an interactive JIT session."
---

`beskid repl` starts the current interactive snippet evaluator. The REPL uses the JIT engine and does not resolve a project in this version.

The REPL uses line-oriented input and output in terminals and pipes. Enter `:quit` or send end-of-file to stop the session. `--plain` is accepted, but line-oriented interaction is already the default.

```bash
beskid repl
```

Do not use the REPL result as evidence for the AOT behavior of `beskid run`. See [Build, run, and test](/docs/tooling/build-run-test/).

[← Back to CLI command reference](/book/reference/cli/command-reference/)
