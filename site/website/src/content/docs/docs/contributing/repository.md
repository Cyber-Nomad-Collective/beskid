---
title: Set Up the Repository
description: Initialize the superrepo, preserve submodule ownership, and run focused gates.
audience:
  - contributor
  - maintainer
authority:
  status: informative
  sourceLabel: Pinned repository setup script
  sourceHref: https://github.com/Cyber-Nomad-Collective/beskid/blob/90c40a91fefa8150134663de120afcb1ef582f2a/scripts/setup-environment.sh
  limits: This procedure prepares a source checkout. It does not install a supported user release.
verified:
  revision: 90c40a91fefa8150134663de120afcb1ef582f2a
  date: 2026-09-08
---

This source setup does not install Beskid for an end user. Use the [installation procedure](/docs/getting-started/install/) for a supported release.

## Prerequisites

Create a repository checkout. Install Git and the pinned pnpm toolchain. Confirm which root or submodule owner accepts the change.

## Actions

1. From the superrepo root, run `./scripts/setup-environment.sh` to initialize pinned submodules and install root packages.
2. Inspect `git status --short` in the root and in the submodule that you will change.
3. Run `pnpm --dir site/website test` for website guidance changes.
4. Run the focused gate that the changed component documents. Run broader gates only when the change crosses a contract boundary.
5. Edit public guidance in `site/website/src/content/docs/`. Use the owning generator for derived files; do not edit generated output.

## Expected result

The checkout contains the pinned submodule commits unless an owner made an intentional change. The focused gate passes and reports the changed component.

## Recovery

If a submodule has unrelated work, preserve it and contact the submodule owner. Do not reset unrelated dirty state. If package installation fails, verify pnpm and the root lockfile before you change dependencies.

## Next task

[Change the Standard](/docs/contributing/standard-changes/) or [write Docs](/docs/contributing/documentation/).
