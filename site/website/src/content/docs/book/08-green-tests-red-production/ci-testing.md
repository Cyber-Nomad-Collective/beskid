---
title: "CI and testing"
description: How compiler CI and your pipelines should treat Beskid tests vs conformance crates.
tableOfContents: true
---

CI's job is to ruin your afternoon **before** users do. Beskid splits that work across your repo and the compiler superproject.

## In your repository

Typical pipeline:

1. Install pinned or rolling CLI ([Downloads](/downloads/)).
2. `beskid fetch` / lockfile discipline per [workspace guide](/book/reference/workspace-monorepo/).
3. `beskid test` with `--include-tag fast` on every push; `slow` or `integration` on nightly or main.
4. Optional: `beskid analyze` / `beskid build` on the same graph so tests do not run against fantasy projects.

Use `--json` when a bot needs to summarize failures without reading ANSI colors.

## In the compiler repository

GitHub Actions on `compiler/` runs Rust tests that embed or drive Beskid fixtures—**not** a substitute for your app tests, but the authority on whether `E1601` still means what the spec says.

Workspace members tied to verification (from `compiler/Cargo.toml`):

- `beskid_analysis`, `beskid_codegen`, `beskid_engine`, `beskid_aot` — pipeline under test
- `beskid_tests`, `beskid_e2e_tests` — conformance anchors
- `beskid_cli` — command surface parity

## Superrepo and website CI

The aggregate repo runs Book link/build checks and OpenSpec validation separately from package tests. Docs green + app red is still a bad release—just a different failure mode.

## Reference links

- [Testing framework](/book/reference/testing/)
- [Conformance area](/platform-spec/compiler/conformance/)
- [Build / analyze / run contract](/platform-spec/tooling/cli/build-analyze-run-contract/)

## Next chapter

[09. Contracts, effects, and other polite threats](/book/09-contracts-effects-and-polite-threats/)
