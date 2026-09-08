---
title: Write and run a program
description: Analyze, format, AOT-compile, and execute a minimal Beskid program.
pageKind: task
diagramPolicy: required
audience:
  - evaluator
  - newcomer
authority:
  status: informative
  sourceLabel: Pinned Beskid CLI command model
  sourceHref: https://github.com/Cyber-Nomad-Collective/beskid_compiler/blob/252aa528ac7ee01a64e49e9b88b32393206fbd71/crates/beskid_cli/src/cli.rs
  limits: This procedure verifies one file and the default Main entrypoint. It is not a complete language reference.
verified:
  revision: 252aa528ac7ee01a64e49e9b88b32393206fbd71
  date: 2026-09-08
---

`beskid run` analyzes the source, compiles it ahead of time, links an executable with the matching runtime kit, and runs that executable in a subprocess.

## Prerequisites

Complete [Install Beskid](/docs/getting-started/install/). Work in an empty directory where you can create a file.

## Actions

1. Create `Main.bd` with this source:

```beskid
i32 Main() {
    return 0;
}
```

2. Analyze the source:

   ```bash
   beskid analyze Main.bd --plain
   ```

3. Check its canonical format:

   ```bash
   beskid format Main.bd --check
   ```

4. If the format check reports drift, update the file before the next check:

   ```bash
   beskid format Main.bd --write
   beskid format Main.bd --check
   ```

5. Execute the program through the AOT pipeline:

   ```bash
   beskid run Main.bd --plain
   ```

6. Check the process status with the command that your shell provides. A status of `0` is success.

```mermaid
flowchart LR
  accTitle: Source to AOT execution
  accDescr: The CLI resolves and analyzes Main.bd, lowers it, compiles and links a native executable with the runtime kit, and then starts it as a subprocess.
  A[Main.bd] --> B[Resolve and analyze]
  B --> C[Lower]
  C --> D[AOT compile]
  D --> E[Link runtime kit]
  E --> F[Run subprocess]
```

### Diagram text

1. The CLI resolves `Main.bd` and checks its syntax, names, and types.
2. The compiler lowers the checked program and emits native object code.
3. The linker uses the matching runtime kit to create an executable.
4. The CLI starts the executable as a subprocess and returns its status.

## Expected result

Analysis completes without an error diagnostic. The format check exits successfully. The program prints no text and exits with status `0`.

## Recovery

If analysis points to the function name, use the exact default entrypoint `Main`. If formatting fails, run the documented `--write` command. If linking reports a missing or incompatible runtime kit, reinstall the same toolchain release; do not combine compiler and runtime files from different releases.

## Next task

[Connect the editor and language server](/docs/getting-started/editor/), then use [build, run, and test](/docs/tooling/build-run-test/) for development work.
