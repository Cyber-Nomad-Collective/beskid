---
title: Packages
description: Pack, publish, and read documentation from Beskid packages.
---

# Packages

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

## Document annotation

**Status:** informative.

**Command source:** [pckg CLI reference](/book/reference/cli/commands/pckg/). Package publication rules belong to the standard and registry implementation.
