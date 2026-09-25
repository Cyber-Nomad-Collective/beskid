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

Run `beskid analyze` and `beskid test` **per target**, not once for the whole tree. The [semantic legality gate](/book/14-from-source-to-runs/semantic-pipeline/) only checks what a target actually reaches from its entry point, so a broken helper module nothing imports will not fail `beskid build --target App`; it will only surface once something, such as `beskid test --target Tests`, actually imports it. A green build for one target says nothing about a sibling target you did not ask about.

## In the compiler repository

Woodpecker runs the compiler Rust tests that embed or drive Beskid fixtures. That is **not** a substitute for your app tests, but it is the authority on whether `E1601` still means what the spec says.

Workspace members tied to verification (from `compiler/Cargo.toml`):

- `beskid_analysis`, `beskid_codegen`, `beskid_engine`, `beskid_aot`: pipeline under test
- `beskid_tests_surface`, `beskid_tests_projects`, `beskid_tests_mods`, `beskid_tests_lsp`, `beskid_tests_aot`, `beskid_tests_pckg`, `beskid_tests_interop`, `beskid_tests_cli`, `beskid_tests_composition`, `beskid_tests_abi`, and `beskid_e2e_tests`: conformance anchors, one crate per domain instead of one crate for everything
- `beskid_cli`: command surface parity

## Superrepo and website CI

The aggregate repo runs Book link/build checks and OpenSpec validation separately from package tests. Docs green and app red is still a bad release. It is just a different failure mode.

See also the [testing framework reference](/book/reference/testing/) and the [conformance area](/platform-spec/compiler/conformance/).
