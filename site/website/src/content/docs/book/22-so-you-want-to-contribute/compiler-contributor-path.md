---
title: "Compiler contributor path"
description: Workspace crates, pipeline phases, and how to run tests without melting your laptop.
tableOfContents: true
---

The compiler workspace is Rust: **`beskid_cli`**, **`beskid_analysis`**, **`beskid_codegen`**, **`beskid_engine`**, **`beskid_aot`**, **`beskid_abi`**, **`beskid_runtime`**, **`beskid_pipeline`**, **`beskid_lsp`**, **`beskid_pckg`**, mods, and conformance crates.

## Where to start

1. Read [Implementation map / crate-to-spec anchors](/platform-spec/compiler/implementation-map/crate-to-spec-anchors/).
2. Read chapter [14. From source to something that runs](/book/14-from-source-to-runs/) for pipeline mental model.
3. Use **`beskid_pipeline`** phase IDs for progress—do not sprinkle ad-hoc logging in library crates.

## Tests

```bash
cd compiler
cargo test -p beskid_tests
```

Heavy e2e suites exist—check crate features and CI filters before you run everything on battery power.
