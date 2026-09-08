---
title: Get started
description: Install Beskid, create a small program, and check it with the compiler.
audience:
  - newcomer
authority:
  status: informative
  sourceLabel: Beskid CLI reference
  sourceHref: /book/reference/cli/
  limits: This page gives a verified starting workflow. It does not define language behavior.
verified:
  revision: 252aa528ac7ee01a64e49e9b88b32393206fbd71
  date: 2026-09-08
---

This guide gives you a small, verified Beskid workflow. It is informative guidance. The [Beskid Standard](/docs/standard/) defines language and tool requirements.

## What you need

Install the Beskid toolchain. Confirm that the `beskid` command is on your `PATH`.

```bash
beskid --help
```

The command must print the command help. If it does not, install or repair the toolchain before you continue.

## Do the first check

Create a file named `Main.bd`.

```beskid
i32 Main() {
  return 0;
}
```

Run semantic analysis on the file.

```bash
beskid dev syntax analyze Main.bd
```

The command parses the source, resolves names, and checks types. It does not create a binary.

## Next steps

- Read [Install Beskid](/docs/getting-started/install/) when you need the supported installation path.
- Read [Write and check a program](/docs/getting-started/first-program/) for the first program in more detail.
- Read [Tooling](/docs/tooling/) for the command groups.
- Read [Projects](/docs/projects/) before you add a manifest or dependencies.
