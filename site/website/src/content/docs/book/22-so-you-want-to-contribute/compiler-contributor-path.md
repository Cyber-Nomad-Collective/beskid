---
title: "Compiler contributor path"
description: Workspace crates, pipeline phases, and how to run tests without melting your laptop.
tableOfContents: true
---

The compiler workspace is Rust. Its current public command path includes **`beskid_cli`**, **`beskid_analysis`**, **`beskid_queries`**, **`beskid_codegen`**, **`beskid_isle`**, **`beskid_engine`**, **`beskid_repl`**, **`beskid_aot`**, **`beskid_abi`**, **`beskid_pipeline`**, **`beskid_lsp`**, **`beskid_pckg`**, Mods, and focused conformance crates.

## Where to start

1. Read [Implementation map / crate-to-spec anchors](/docs/standard/compiler/implementation-map/crate-to-spec-anchors/).
2. Read chapter [14. From source to something that runs](/book/14-from-source-to-runs/) for pipeline mental model.
3. Use **`beskid_pipeline`** phase IDs for progress—do not sprinkle ad-hoc logging in library crates.

## Tests

```bash
cd compiler
cargo test -p beskid_tests_surface
```

Select the focused `beskid_tests_*` crate for the area that you changed. Run the repository gate before you submit the change. See [Repository setup](/docs/contributing/repository/) for the current checkout and verification procedure.
