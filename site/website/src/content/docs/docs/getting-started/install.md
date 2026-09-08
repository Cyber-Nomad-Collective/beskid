---
title: Install Beskid
description: Install the current Beskid toolchain and verify the command line interface.
---

# Install Beskid

Use the current release instructions on the [Downloads](/downloads/) page. That page names the available artifacts and the supported installation methods.

## Verify the installation

Open a new terminal after you install the toolchain.

```bash
beskid --help
```

The command must print help text and exit successfully. Then inspect the installed version.

```bash
beskid --version
```

Do not copy a compiler binary from an unverified build directory. Use a release artifact or a local toolchain build that you control.

## Build the toolchain from this repository

The repository uses a Rust workspace for the compiler and a pnpm workspace for sites. Run the setup script first.

```bash
./scripts/setup-environment.sh
```

Install the compiler tools with the repository task runner when you work from a checkout.

```bash
just replace
```

This command installs `beskid` and `beskid_lsp` from the current checkout. Run the command again after compiler changes.

## Document annotation

**Status:** informative.

**Verified source:** [Downloads](/downloads/) is the public distribution entry point. `scripts/setup-environment.sh` and `just replace` are repository-maintained developer commands.
