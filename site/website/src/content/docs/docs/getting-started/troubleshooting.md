---
title: Troubleshoot the first day
description: Recover from installation, PATH, analysis, runtime-kit, and editor failures.
audience:
  - newcomer
  - developer
authority:
  status: informative
  sourceLabel: Pinned Beskid CLI command model
  sourceHref: https://github.com/Cyber-Nomad-Collective/beskid_compiler/blob/252aa528ac7ee01a64e49e9b88b32393206fbd71/crates/beskid_cli/src/cli.rs
  limits: This page covers first-day failures. It does not replace the diagnostic or issue tracker references.
verified:
  revision: 252aa528ac7ee01a64e49e9b88b32393206fbd71
  date: 2026-09-08
---

Use the first failed observation to select a recovery path. Do not change multiple installation or source settings at the same time.

## Prerequisites

Keep the failing command, its complete output, your operating system, and the output of `beskid --version` when that command works.

## Actions

1. If `beskid` is not found, open a new terminal and inspect which executable the shell selects.
2. If the version or host is wrong, compare `beskid --version` and `beskid up host-target` with the selected Downloads artifact.
3. If `beskid analyze Main.bd --plain` fails, start at the first diagnostic and correct the named span. Keep the entrypoint spelling `Main`.
4. If `beskid run Main.bd --plain` reaches linking and fails, reinstall the compiler and runtime kit from the same release.
5. If VS Code has no diagnostics, run **Beskid: Install LSP**, reload the window, and inspect the extension output channel.
6. Run one failed check again. Continue only after its observable result matches the task page.

```mermaid
flowchart TD
  accTitle: First-day troubleshooting
  accDescr: Start with the earliest failed check, then repair PATH, artifact selection, source diagnostics, runtime-kit compatibility, or the editor language-server path before retrying once.
  A[First failed check] --> B{Failure type}
  B -->|Command missing| C[Repair PATH]
  B -->|Wrong version or host| D[Install matching artifact]
  B -->|Source diagnostic| E[Fix first source span]
  B -->|Link failure| F[Reinstall matching runtime kit]
  B -->|No editor diagnostics| G[Install or select LSP]
  C --> H[Retry one check]
  D --> H
  E --> H
  F --> H
  G --> H
```

### Diagram text

| Observation | Recovery |
| --- | --- |
| Shell cannot find `beskid` | Open a new terminal and repair `PATH`. |
| Version or host does not match | Install the exact host artifact from Downloads. |
| Analysis emits a diagnostic | Fix the first named source span, then analyze again. |
| AOT link fails on the runtime kit | Reinstall compiler and runtime files from one release. |
| VS Code shows no diagnostics | Install or explicitly select the language server. |

## Expected result

The previously failing check now succeeds without introducing a new failure in an earlier check.

## Recovery

If the same check still fails, capture the exact command, full output, Beskid version, host target, and selected release tag. Search existing project issues before you report a new one. Do not post tokens, credentials, or private source code.

## Next task

Return to [Get started](/docs/getting-started/) and continue with the first incomplete task, or open [Tooling](/docs/tooling/) after all checks pass.
