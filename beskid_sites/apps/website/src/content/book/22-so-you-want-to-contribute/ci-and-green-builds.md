---
title: "CI and green builds"
description: Woodpecker builds across the superrepo and submodules, and how to triage failures from retained logs.
tableOfContents: true
---

Builds run per repository and submodule through Woodpecker CI. When a pipeline is red, inspect the
failed step and its retained log before guessing.

Superrepo changes often need commits in **`compiler`**, **`pckg`**, or **`beskid_vscode`** first, then a submodule pointer bump. Pushing only the parent repo is a classic way to achieve "green locally, red everywhere."

## Website CI

The website app's own test suite (`pnpm test`) checks the Book route and content manifest before the site builds. Root CI separately runs `openspec validate --all --strict` against platform-spec. Neither build substitutes for the other.
