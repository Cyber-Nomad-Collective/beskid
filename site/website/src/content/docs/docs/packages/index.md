---
title: Packages
description: Pack, publish, and read documentation from Beskid packages.
audience:
  - package author
authority:
  status: informative
  sourceLabel: Beskid package CLI reference
  sourceHref: /book/reference/cli/commands/pckg/
  limits: This page gives a verified package workflow. It does not define publication rules.
verified:
  revision: 252aa528ac7ee01a64e49e9b88b32393206fbd71
  date: 2026-09-08
---

The Beskid package registry stores one immutable `.bpk` artifact for each published package version. Use the package CLI after you have a resolved project and a valid package artifact.

## Pack a package

Create an artifact from a package source directory.

```bash
beskid dev package registry pack --package my-lib --source ./my-lib --output ./my-lib.bpk
```

For an ordinary library package, the command generates API documentation before it creates the artifact. Generated documentation is stored under `.beskid/docs/` in the package.

## Publish the artifact

Configure authentication before you upload. Then upload the exact artifact that you packed.

```bash
beskid dev package registry upload my-lib --artifact ./my-lib.bpk
```

The registry reads the version from the validated artifact. Do not supply a different version during upload.

## Package documentation

The package browser shows Markdown from `docs/**/*.md`, the optional root `README.md`, and `.beskid/docs/**/*.md`. Use these paths for package-specific guidance. Use this public Docs site for Beskid-wide guidance.
