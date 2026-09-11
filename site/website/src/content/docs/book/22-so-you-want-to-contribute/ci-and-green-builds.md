---
title: "CI and green builds"
description: Woodpecker builds across the superrepo and submodules, and how to triage failures from retained logs.
tableOfContents: true
---

Builds run per repository and submodule. When a pipeline is red, inspect the
failed Woodpecker step and its retained log before guessing.

Superrepo changes often need commits in **`compiler`**, **`pckg`**, or **`beskid_vscode`** first, then a submodule pointer bump—pushing only the parent repo is a classic way to achieve "green locally, red everywhere."

## Website CI

`site/website` prebuild tests typed embeds and catalog-backed platform-spec aliases before Astro renders the Book. Root CI separately runs `openspec validate --all --strict`; neither build may substitute for the other.
