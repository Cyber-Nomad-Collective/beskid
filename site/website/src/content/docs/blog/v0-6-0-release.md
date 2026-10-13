---
title: "beskid 0.6.0: One Front End, Function Values and Rust Glue"
description: "beskid 0.6.0 retires the second type checker, makes functions values, lets a for loop walk your own iterators, calls Rust in process through a checked C ABI and removes the runtime's fixed table sizes."
date: 2026-10-13
blogStatus: in-progress
release: v0.6.0
draft: true
cover:
  src: "/blog-covers/v0-6-0-release.jpg"
  alt: "Railroad crews and officials of the Central Pacific and Union Pacific gather around two locomotives touching pilots at Promontory Summit, Utah, on 10 May 1869, where the two lines met."
  sourceHref: "https://commons.wikimedia.org/wiki/File:East_and_West_Shaking_hands_at_the_laying_of_last_rail_Union_Pacific_Railroad_-_Restoration.jpg"
  sourceLabel: "Andrew J. Russell, Public domain"
---

<!-- DRAFT. Update `date` to the publication date, set `blogStatus: released` and `draft: false` only after the release evidence below exists. The cover file /blog-covers/v0-6-0-release.jpg must be added before publication. -->

<!-- VERIFY: three-platform release evidence (Linux x64, macOS arm64, Windows x64; 86 mandatory cases each) is not complete. Ship this lead sentence only when it is. -->
**beskid 0.6.0 is out for Linux, macOS and Windows.** The 0.5 line was about talking to other machines. 0.6 is about the compiler agreeing with itself, and about talking to other languages on the same machine.

Until now a program went through two type checkers on its way to a binary: the query layer, and an older checker that ran again before code generation. Most of the time they agreed. When they did not, a program that passed analysis failed at build time with an error the first checker had never heard of. 0.6.0 deletes the older one. Everything else in this release was built on that.

## One front end

The `beskid_queries` query layer is now the only semantic authority for `check`, `build`, `run`, `test` and the language server. Code generation lowers what the query layer proved, through `TypedProgram`, `CodegenInput` and ISLE (Cranelift's rule language for instruction selection) to Cranelift IR. The legacy `TypeChecker` and its lowering preparation are gone, not hidden behind a flag.

Three things follow from that. A program that `check` accepts does not fail a second type check at build time. A single `.bd` file outside a project gets the same checks as a file inside one. And `Main` is no longer reported as an unused private item, which it never was.

Builds also got faster, from parallel item emission, streamed query snapshots and query results that are reused when the content they depend on has not changed. There is no clean before-and-after benchmark for a typical project yet, so this post does not quote one.

## Functions are values

A function type is now a reference type. Its value is a closure record managed by the garbage collector, and you can pass it, store it in a field, return it and call it. A named function can be used as a value directly:

<!-- Source: compiler/crates/beskid_codegen/tests/isle_adapter/function_values.rs:28 and :280 -->
```beskid
i64 Apply(i64 v, (i64) => i64 f) { return f(v); }
i64 Double(i64 x) { return x * 2; }
i64 Main() { return Apply(4, Double); }
```

Calls work through parameters, locals, fields (`h.op(5)`) and call results (`Make()(1)`). A lambda takes its parameter and return types from the place that declares the function type: an annotated local, a field, a return type or the parameter it is passed to.

Allocation follows use. A lambda that is immutable, has an expression body and is only ever called is lowered inline and allocates nothing. Any other lambda allocates its record when it is evaluated. Captures are copies taken at that moment. A lambda that captures a `mut` local outside `spawn` is rejected with E1233, because a copy of a variable that keeps changing is a bug report waiting to be filed.

## `for` walks your own types

`for x in values` now iterates an array, evaluated once and read in index order. It also iterates any type with a `Next()` method that returns `Option<T>`:

<!-- Source: compiler/crates/beskid_engine/tests/fixtures/iterator_for.bd:5, :12-20, :44-54 -->
```beskid
pub enum Option<T> { Some(T value), None }

pub type Counter {
    i64 current,
    i64 limit,
    pub Option<i64> Next() {
        if this.current >= this.limit { return Option::None; }
        this.current = this.current + 1_i64;
        return Option::Some(this.current);
    }
}

// 1 + 3 + 4: `continue` skips 2, `break` stops at 5.
i64 SkipTwoStopAtFive() {
    Counter counter = Counter { current: 0_i64, limit: 9_i64 };
    mut i64 total = 0_i64;
    for value in counter {
        if value == 2_i64 { continue; }
        if value == 5_i64 { break; }
        total = total + value;
    }
    return total;
}
```

The iterator is evaluated once and kept alive by the loop, so the collector can run inside the body. Generic iterators and loops inside generic functions work too. Outside generic code, `check` rejects anything else in a `for` with E1215, so it accepts exactly what `build` can lower.

## Smaller language changes

- **Qualified paths without `use`.** `Core.Output.Write(...)` resolves as long as the package is in your dependency closure. A local name with the same spelling wins. If two packages provide the same module path, that is an error (E1104) instead of a coin toss.
- **Fields are private by default.** A field without `pub` can only be read or set in the source file that declares its type. Elsewhere it fails with E1211.
- **`Core`, not `Std`.** Corelib modules keep their own roots: `use Core.Output;`. The `Std` namespace and its alias layer are gone.
- **More primitive types:** `i8`, `i16`, `u16`, `u64` and `f32`. Conversions between `char` and `u32` are checked and reject surrogates.

## Mods, serialization and BSOL

Mods are beskid's compile-time extensions. In 0.6.0 they are compiled ahead of time and run in a native Mod host. A Mod is active only for the packages that declare it as a dependency. A Rust procedural macro works the same way: it expands only inside the crates that depend on it. A program whose imports never reach `Core.Serialization` does not run the Serialization Mod, even though Corelib depends on it.

A Mod's descriptor (`mod.descriptor.json`, schema 3) records each build tool by digest and version output. Generators contribute typed syntax (contracts, types, functions, impl blocks) instead of source strings. The toolchain ships the Corelib Mods prebuilt, so the first build of a fresh project does not start by compiling them.

That machinery carries two new Corelib packages, both written in beskid. `Core.Serialization` holds format-independent data values, shape identities, limits and checked decimal parsing. `Core.Bsol` is a native BSOL lexer, parser, writer and schema validator, with profile composition, offline import resolution, migration and typed reads and writes.

`Core.Dynamic` wraps a registered value with its shape and casts it back with a checked result.

<!-- VERIFY: Dynamic mapping DYN-06-03/04 pending -->
Mapping one registered shape to another builds a fresh destination and accepts only lossless conversions. A narrowing or a failing nested field rejects the whole mapping, with no partial result and no change to the source.

Corelib also gains `Core.Process` (start a child, pipe its standard streams, wait with a deadline, terminate it), `Core.Json`, string search and builders, number parsing and formatting, sorting, hashed collections, lexical paths and calendar arithmetic.

## Rust Glue

A beskid library can now call Rust in the same process through a checked C ABI. The project declares a Rust owner in its manifest:

<!-- Source: compiler/crates/beskid_tests_interop/fixtures/glue/manual/owned/manual_owned.bproj (glue block); also docs/release/v0.6.0-release-notes.md:95-100 -->
```bsol
glue "glue_manual" {
    backend = rust
    path = "rust"
}
```

The label is the native library identity. It matches the `Library` string of the `Extern` contracts and `[GlueHandle]` types that the Rust side implements. `[RustOwner(Path: ..)]` maps a method or a handle type to a Rust path. `beskid build --backend glue-rust` takes explicit tools (`--linker`, and `--rust-toolchain` or `--cargo` with `--rustc`) and produces the beskid consumer plus one Rust owner image per `glue` block. Each image carries an admission record, and the consumer pins every owner image by digest.

The boundary admits fixed-width integers, `f32` and `f64`, `bool`, Unicode scalars, UTF-8 and byte views, arrays, unit and branded opaque handles. An import marked `[RustOwner(Fallible: true)]` hands the Rust side's failure status back to the calling export instead of trapping. A borrowed handle released from a different OS thread than the one that opened it gets the `Foreign` status.

There is no stdio bridge in 0.6.0. `Core.Glue` still exists as a provisional package with no 0.6 obligation, and its release cases fail closed. The 0.4 Glue scaffold (the seven Glue Mod contracts, `[Glue]`, `[GlueImport]`, `[GlueExport]` and `GlueBackendKind`) is deleted.

## No more fixed runtime limits

Every scheduler and synchronization table (fibers, run queue, channels, mutexes, wait groups, hubs, poll tasks, external waits and the rest) now grows on demand. Records never move, so handles stay valid as tables grow. The remaining limit is the system allocator.

The managed heap has no fixed cap either. `BESKID_HEAP_MAX` sets one, in bytes with an optional `k`, `m` or `g` suffix. `BESKID_FIBER_STACK_MAX` sets the stack reservation per fiber: 8 MiB by default, in whole multiples of 64 KiB. The runtime reads both at startup, however the program was started.

On Windows, a network transfer that completes as its deadline fires now keeps its data instead of reporting a timeout. A cancel waits at most 250 ms for the kernel to report the operation; after that the call returns, and the runtime holds the operation's memory until the kernel lets go of it.

`Thread.Spawn`, `Thread.Join`, `Thread` and `ThreadError` are removed. Fibers, started with `spawn`, are the concurrency model. `Thread.Yield` stays.

## A CLI built around tasks

Everyday commands sit at the root: `new`, `check`, `build`, `run`, `test`, `fmt`, `doc`, `add`, `remove`, `update`, `package`, `toolchain` and `doctor`. Compiler inspection moved under `beskid dev`. An old spelling such as `beskid analyze` fails and names its replacement.

```sh
beskid new Hello
beskid run --project Hello -- first second
```

- `beskid new` works offline with the bundled application template.
- `beskid add <package>[@<version>]`, `remove` and `update` change the manifest and `Project.lock` as one transaction. A failed resolution leaves both files as they were, and unrelated manifest text is preserved.
- `beskid run` passes everything after `--` to the program unchanged. A program killed by a signal exits with 128 plus the signal number.
- `check`, `build`, `test`, `add`, `remove`, `update` and `doctor` take `--json` and print NDJSON (newline-delimited JSON): one record per line, each with `schemaVersion`, ending in one result record. `beskid dev capabilities --json` lists the commands and their output schemas, so a tool can ask instead of parsing `--help`.
- `-q`/`--quiet` and `-v`/`--verbose` are global.
- `beskid doctor` reports installation problems without changing anything.

<!-- VERIFY: transitive resolution pending -->
Registry dependencies resolve transitively: adding a package also locks the packages it depends on, and removing it drops the ones nothing else needs.

<!-- VERIFY: VS Code extension 0.6.0 published (beskid_vscode package.json is 0.6.0; release tag and Marketplace listing not confirmed) -->
The VS Code extension 0.6.0 uses the new command surface and installs the language server through `beskid dev lsp install`.

## Before you upgrade

beskid has no users yet, so there is no migration guide. For the record, these changes break existing code:

- Old root commands (`analyze`, `format`, `pckg`, `up`, and the inspection commands now under `dev`) are rejected.
- `Std.`-qualified paths no longer resolve. A Corelib dependency labelled `Std` must be labelled `Core`.
- Non-`pub` fields are private to their source file (E1211).
- A module path provided by two packages fails (E1104).
- A lambda that captures a `mut` local outside `spawn` fails (E1233).
- `BESKID_HEAP_MAX_BYTES` is now `BESKID_HEAP_MAX`.
- `Thread.Spawn` and the 0.4 Glue attributes and Mod contracts are gone.

## What is still missing

- **Glue extensions.** Records by value, callbacks, function types across the boundary, enums and Glue-driven exports wait for 0.6.1. The Rust side of an export is linked by hand today. `glue-dotnet` is unavailable.
- **Generic functions as values.** A generic function has no entry that works without a type context, so it cannot be passed as a value.
- **Parallelism.** 0.6.0 runs fibers. It does not run your code on more than one core at a time.

## What comes next

Parallel execution arrives in steps, each one depending on the previous. 0.6.1 brings attributes on every declaration and the prerequisites for isolates. 0.6.2 adds incremental marking to the collector and the `move` keyword. 0.6.3 adds isolates and `Parallel.Scope`. 0.6.4 adds ports. 0.6.5 adds `.Parallel()` on sequences, with sharing between heaps modelled on ORCA, the protocol Pony uses to collect objects that actors share. No dates. Dates are the part of a roadmap that ages worst.

## Install or upgrade

<!-- VERIFY: cli-v0.6.0 release assets, Homebrew formula 0.6.0, and the packaging notes (Windows installer waiver, unsigned DMG) must exist and match before publication. -->
On macOS, use the Homebrew tap:

```sh
brew tap cyber-nomad-collective/beskid https://github.com/Cyber-Nomad-Collective/beskid_homebrew.git
brew upgrade cyber-nomad-collective/beskid/beskid
```

On Windows, download the [0.6.0 setup executable](https://github.com/Cyber-Nomad-Collective/beskid_compiler/releases/download/cli-v0.6.0/beskid-0.6.0-windows-amd64.exe). On Linux, download the [AMD64 DEB](https://github.com/Cyber-Nomad-Collective/beskid_compiler/releases/download/cli-v0.6.0/beskid-0.6.0-amd64.deb). The [versioned release](https://github.com/Cyber-Nomad-Collective/beskid_compiler/releases/tag/cli-v0.6.0) also has the Windows MSI and the macOS DMG, and the [native bundles](https://github.com/Cyber-Nomad-Collective/beskid_compiler/releases/tag/v0.6.0) carry a complete installed prefix.

`beskid --version` should print `0.6.0`. `beskid doctor` checks the installation without changing it. The [install guide](/docs/getting-started/install/) covers the platform compilers and linkers that native builds need. Rust Glue builds also need a Rust toolchain that you pass in explicitly.
