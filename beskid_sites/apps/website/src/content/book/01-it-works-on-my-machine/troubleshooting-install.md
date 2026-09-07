---
title: "Troubleshooting install"
description: Wrong architecture, PATH ghosts, corelib paths, and other first-day install failures.
tableOfContents: true
---

Install failures cluster into a small set of archetypes. This page is the checklist before you open a thread titled "beskid broken??"

## Wrong architecture / OS

Symptoms: exec format error, immediate segfault on launch, or the script downloaded a binary your CPU refuses to respect.

Fixes:

- Re-run the install flow for **your** platform tab on [Downloads](/downloads/).
- On Apple Silicon vs Intel Mac, match the arch the release matrix actually built.
- On WSL vs native Linux, do not mix Windows binaries into a Linux PATH.

## `beskid: command not found`

You installed successfully and the shell still cannot see it.

1. `echo $PATH` — is the install bin directory present?
2. New terminal after editing `~/.bashrc` / `~/.zshrc`.
3. `type beskid` — is a shell alias/function shadowing the binary?

## Version mismatch (CLI vs LSP vs project)

Symptoms: parse works in CLI, red squiggles nonsense in the editor (or the reverse).

Align versions:

- Extension settings: bundled vs custom LSP path.
- `beskid --version` vs the binary the extension launches.
- Reinstall extension after upgrading CLI.

## Corelib / standard library materialization

Symptoms: errors mentioning missing corelib tree, stale std paths, or first-run download messages that never finish.

- Set `BESKID_CORELIB_SOURCE` to a local corelib checkout when developing the standard library (see [corelib command](/book/reference/cli/commands/corelib/)).
- Ensure network access if your environment blocks first-run extraction (corporate proxy special hell).

## Permission and quarantine (macOS)

Downloaded binaries may need quarantine cleared or explicit approval in Security settings. This is OS policy, not Beskid philosophy.

## Still stuck?

Capture:

```bash
which beskid
beskid --version
uname -a
```

Open an issue with that block. Accusing the borrow checker is optional.

## Next chapter

[02. PATH not found — tooling anyway](/book/02-path-not-found-tooling-anyway/)
