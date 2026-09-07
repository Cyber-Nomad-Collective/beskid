---
title: "Build from source"
description: When prebuilt CLI binaries are not enough—compiler workspace, Rust toolchain, and local `beskid` binaries.
tableOfContents: true
---

Sometimes you need the compiler at **exactly** the commit you are hacking on. Sometimes CI artifacts lag your branch by one merge. Sometimes you just distrust binaries you did not compile yourself. Valid.

## Prerequisites

- **Rust toolchain** matching the compiler workspace (see `compiler/rust-toolchain.toml` if present).
- Clone the **`compiler`** submodule/repo (Beskid superrepo: `compiler/`).
- Patience for a full workspace build the first time.

The CLI crate is `beskid_cli` in the compiler workspace (`compiler/crates/beskid_cli/`). Workspace members and shared deps live in the root `Cargo.toml`—follow existing crate boundaries; do not invent a second CLI entry crate because you were bored.

## Typical dev build

From the compiler repository root:

```bash
cargo build -p beskid_cli --release
```

Your binary lands under `target/release/beskid` (exact path follows Cargo's target dir). Put **that** directory on PATH ahead of release installs, or invoke with an absolute path while iterating.

## Pointing the extension at a dev LSP

The VS Code extension can use a bundled language server or a path you configure for local development (covered in [VS Code and LSP](/book/02-path-not-found-tooling-anyway/vscode-and-lsp/)). Rule of thumb: **one** `beskid`/`beskid-lsp` build per terminal session—mixing release CLI with debug LSP from another commit is how you get "but it worked in the editor."

## When source build is worth it

| Reason | Build from source |
| --- | --- |
| Contributing compiler/LSP fixes | Yes |
| Bisecting a regression on `main` | Yes |
| Writing Beskid application code only | Prefer release CLI |
| CI reproducibility | Pin release + hash; source optional |

## Reference

- [Contributing / compiler layout](/book/reference/contributing/) (if present in your checkout)
- [Platform spec — compiler domain](/platform-spec/compiler/)

## Next

[First smoke test](/book/01-it-works-on-my-machine/first-smoke-test/)
