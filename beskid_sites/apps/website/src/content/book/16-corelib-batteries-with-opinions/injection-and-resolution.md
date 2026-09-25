---
title: "Injection and resolution"
description: Every project gets the same corelib without declaring it. How the resolver finds it, and what the override is for.
tableOfContents: true
---

You do not add the standard library as a dependency. The resolver injects the `corelib` package into every project graph before it resolves anything else, and every `corelib_*` package comes with it. A beginner cannot ship a program that forgot the standard library, and a veteran cannot fork reality by pointing at a `corelib` on a USB stick and calling it a dependency.

## Discovery order

1. `BESKID_CORELIB_SOURCE`, if set: a materialized workspace on disk. Development only.
2. The corelib embedded in the installed toolchain.

That is the whole list. There is no search of the current directory, no lookup in a global package cache, and no "use whichever corelib the language server happened to find". The implicit standard library resolves exclusively from the toolchain that is running, so two machines with the same `beskid --version` see the same `Core.*` by construction.

## What injection gives you

- `Core.*` is reachable in every file without a `use`. Writing `use Core.Output;` is still fine and the corelib does it for clarity.
- Everything else in the corelib workspace is in the graph and importable by module path: `use Concurrency.Fiber;`, `use Network.Tcp.TcpStream;`, `use Http.Client;`.
- The lockfile records the resolved corelib packages like any other dependency, with their materialized paths under `obj/beskid/deps/src/`.

## Native imports are checked before emission

Corelib packages that reach into the runtime declare their native imports. Before lowering, the compiler checks that every declared import is one the runtime kit provides. A copied or unknown service name fails the build with the name in the diagnostic rather than an undefined symbol from the linker. This is the reason a mismatched corelib and runtime cannot produce a binary: the check runs first.

## When to override

You are fixing the standard library, and you want the fix under test before it is in a release. That is the case. `beskid corelib --output`, edit, `BESKID_CORELIB_SOURCE`, build, test. Production consumers rely on the embedded copy and the registry, never on a path.

Contracts: [corelib injection and resolution](/platform-spec/core-library/compiler-integration/corelib-injection-and-resolution/), [resolution and projects](/platform-spec/compiler/resolution-and-projects/).
