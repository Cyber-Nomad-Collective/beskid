---
title: "Corelib layout"
description: Standard library packages, corelib identity, and where Beskid ships the std."
tableOfContents: true
---

Application code is yours. **Corelib** is the shared floor: collections, results, options, the stuff you should not rewrite per repo.

## Identity

Package identity is **`corelib`**. Sources live in the compiler's `corelib` submodule as a workspace: `corelib/CoreLib.bws` at the root, with member packages under `corelib/packages/` (each its own `.bproj`).

Beskid's standard library implementation stays **Beskid source**, not a side Rust crate pretending to be std.

## Tooling materialization

The CLI ensures a bundled corelib is available on launch; override with `BESKID_CORELIB_SOURCE` when hacking on std, or point resolution at an existing checkout with `BESKID_CORELIB_ROOT`. [`beskid corelib`](/book/reference/cli/commands/corelib/) materializes embedded templates for offline or bootstrap scenarios.

## Layout mental model

Corelib splits into **interlinked workspace packages**, not one monolithic `IO.bd` dumping ground:

- **foundation**: `Core.*`: `Core.Optional.Option`, `Core.Results.Result`, `Core.Collections`, `Core.String`, `Core.Bytes`, `Core.IO`, `Core.FS`, `Core.Time`, `Core.Args`, `Core.Disposable`, `Core.Output`/`Input`/`Error`, `Core.Math`, `Core.Random`, `Core.Process`, `Core.Environment`, `Core.Path`, `Core.Encoding`
- **runtime**: process init and host linkage
- **concurrency**, **console**, **network**, **http**: opt-in packages for their respective domains
- **interop**, **glue**, **compiler-sdk**, **pest-gen-schema**: tooling-facing packages

`Core.*` is **implicit**: the resolver injects `corelib`'s foundation package into every project, so `Option<T>` and friends resolve with no `use` at all. The other packages (`Network`, `Http`, `Concurrency`, `Console`, ...) are ordinary dependencies and need an explicit `use` like anything else.

## Docs and `api.json`

Compiler `doc` emission can place `api.json` and markdown under `.beskid/docs/`. Registry and pckg treat structured API JSON as the primary contract. You consume std docs like any package docs, not a separate mythological website.

See also the [core library](/platform-spec/core-library/) domain reference and the [Option type](/platform-spec/language-meta/type-system/types/) entry.
