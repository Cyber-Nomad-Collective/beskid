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

- Corelib modules are imported under the `Std` root: `use Std.Core.Output;`, `use Std.Core.Optional;`. A bare `Output.WriteLine(...)` with no import is an unknown value, and `use Core.Output;` in application code is an E1105. A fully qualified call such as `Std.Core.Output.WriteLine("x")` needs no `use`.
- `use Std.Concurrency.Fiber;` and `use Std.Testing.Assert;` resolve from an ordinary project. `Network`, `Http`, and `Console` are separate packages, and in a bare project `use Std.Network.Tcp;` and `use Std.Console.Console;` are rejected as unknown import paths. Treat their import form as something to confirm against your toolchain rather than something this page promises.
- The unrooted form, `use Core.Results;`, is what you see inside the corelib packages and in projects that depend on the `corelib` package by name.
- The lockfile records the resolved corelib packages like any other dependency, with their materialized paths under `obj/beskid/deps/src/`.

## Native imports are checked before emission

Corelib packages that reach into the runtime declare their native imports. Before lowering, the compiler checks that every declared import is one the runtime kit provides. A copied or unknown service name fails the build with the name in the diagnostic rather than an undefined symbol from the linker. This is the reason a mismatched corelib and runtime cannot produce a binary: the check runs first.

## When to override

You are fixing the standard library, and you want the fix under test before it is in a release. That is the case. `beskid corelib --output`, edit, `BESKID_CORELIB_SOURCE`, build, test. Production consumers rely on the embedded copy and the registry, never on a path.

Contracts: [corelib injection and resolution](/platform-spec/core-library/compiler-integration/corelib-injection-and-resolution/), [resolution and projects](/platform-spec/compiler/resolution-and-projects/).
