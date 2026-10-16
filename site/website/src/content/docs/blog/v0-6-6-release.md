---
title: "beskid 0.6.6: More Than One Core"
description: "beskid 0.6.6 runs your code on more than one core. Isolates with their own heaps, fork-join scopes, ports, pipelines and parallel sequences, built on transfer classes, the move keyword and an incremental collector, plus records, enums and callbacks across Rust Glue."
date: 2026-10-16
blogStatus: in-progress
release: v0.6.6
draft: true
---

<!-- DRAFT. Update `date` to the publication date, set `blogStatus: released` and `draft: false` only after the release evidence exists. -->
<!-- VERIFY: choose a public-domain cover image under /blog-covers/v0-6-6-release.jpg and add the `cover` block (src, alt, sourceHref, sourceLabel) as in the 0.6.0 post. -->

<!-- VERIFY: three-platform release evidence (Linux x64, macOS arm64, Windows x64; 86 mandatory cases each) is not complete. Ship this lead sentence only when it is. -->
**beskid 0.6.6 is out for Linux, macOS and Windows.** 0.6.0 ran fibers on one core. 0.6.6 runs your code on all of them.

There is no 0.6.1, 0.6.2, 0.6.3, 0.6.4 or 0.6.5. We planned five steps, and each one depended on the one before it: you cannot share a value between two heaps before the compiler knows which values are safe to share, and you cannot collect a heap that another thread writes to before the collector can work in steps. Shipping the steps one at a time would have meant five releases in which the new parts did nothing on their own. So they ship together.

## Isolates, not threads

A parallel program needs an answer to one question: who may write this object? Most languages answer "whoever holds a lock". beskid answers "the heap it lives in".

The unit of parallelism is the isolate. An isolate is a runtime instance with its own heap, its own garbage collector and its own fiber scheduler, on its own OS thread. Fibers, channels and mutexes stay inside one isolate, as they did in 0.6.0. Values cross between isolates in three places only: what a task captures, what a task returns, and what goes through a port.

A fork-join scope starts tasks and waits for all of them:

<!-- Source: compiler/corelib/beskid_corelib/tests/corelib_tests/src/parallel/ParallelSuite.bd:88-97 -->
```beskid
test scope_joins_every_task_before_returning {
    Result<i64, ParallelError> result = Parallel.Scope<i64>((Core.Parallel.Scopes.Scope s) => {
        Task<i64> left = s.Spawn(() => 20_i64);
        Task<i64> right = s.Spawn(() => 22_i64);
        i64 a = OrZero(left.Join());
        i64 b = OrZero(right.Join());
        return Result::Ok(a + b);
    });
    Assert.Equal<i64>(ScopeValue(result), 42_i64, "two tasks sum to 42");
}
```

The scope returns only after every task it started has finished, on every exit path. A task that fails cancels its siblings, and the scope reports every failure in spawn order. `BESKID_ISOLATES_MAX` caps the number of live isolates; by default it is the number of logical processors. When no isolate is free, `Spawn` runs the task on the caller before it returns, so nested scopes never wait for a slot that will not come.

## What may cross: transfer classes

The compiler gives every type one of four transfer classes:

- **Shared**: nothing can write it, so any heap may point at it. Primitives, `string`, and `[Immutable]` types whose fields are Shared.
- **Moved**: it has exactly one owner, and the owner changes when it crosses. Arrays and `[Isolated]` types, including every Corelib collection.
- **Copied**: plain data, copied at each crossing. `[Copyable]` types.
- **Never**: it stays where it was made. Function values, pointers, fibers, channels, sockets and every type without a marker.

You do not write the class. You write a marker on the type, and the compiler checks the fields against it. A task that captures a Never value fails to compile with E1236. A port of a type that is not transferable fails with E1610, and the message says which field is the reason.

## `move`

A Moved value can only be handed over if nobody else is still holding it. 0.6.6 makes that explicit with `move`:

- `move x` consumes `x`. Using `x` afterwards is E1234.
- `move x.f` takes the value out of a field and leaves an empty one behind: `None`, an empty array or an empty list.
- `exchange(place, move value)` puts a new value into a field or an array element and gives you the old one.
- `move this` on a method makes the receiver owning.

The Corelib collections use the last one. Their mutators consume the collection and return it, so a list is rebound as it grows:

```beskid
list = list.Push(value);
```

<!-- Source: compiler/corelib/packages/foundation/src/Core/Collections/List.bd:31 (`pub List<T> Push(move this, T value)`) -->

If you forget the rebinding, the compiler tells you that `list` was moved. This is the change most likely to break code written for 0.6.0. We think it is worth it: two live lists that share one storage array was a bug class, and now it is a compile error.

## Ports, pipelines and parallel sequences

A port is a bounded queue between isolates. `Send` parks while the port is full, `Receive` parks while it is empty, and the scope closes its ports when it returns. A Shared value crosses a port by pointer, a Moved value by hand-over, and a Copied value by copy. Pipelines chain stages through ports, and `Ordered()` puts the records of a multi-worker stage back into input order.

Most of the time you will not touch ports at all. A Corelib list has `.Parallel()`:

<!-- Source: compiler/corelib/beskid_corelib/tests/corelib_tests/src/parallel/ParallelSuite.bd:559-568 -->
```beskid
test where_and_map_fuse_into_a_reduction {
    List<i64> values = Numbers(1000_i64);
    i64 parallel = values
        .Parallel()
        .Where((x) => x % 2_i64 == 0_i64)
        .Map((x) => x * x)
        .Reduce(0_i64, SumI64 { });
    Assert.Equal<i64>(parallel, 166167000_i64, "sum of squares of evens below 1000");
    Assert.Equal<i64>(parallel, SerialSumOfSquaresOfEvens(values), "parallel equals serial elision");
}
```

The source is borrowed, not copied. `Where` and `Map` run nothing; the terminal operation runs them in one fused pass per chunk. Chunks start at one per isolate and split in half when another isolate is idle, with a floor measured from the work done in the first millisecond, so cheap bodies get large chunks and expensive ones get small chunks. `Reduce` keeps input order, and a plan without ports, clocks, random numbers or I/O gives the serial result for every isolate count. The combiner must declare that it is associative. The compiler does not prove that claim, so do not lie to it.

## Sharing between heaps without stopping the world

If an object in one heap is referenced from another, which collector may free it? beskid follows ORCA, the protocol the Pony language uses for objects that its actors share. The owning heap keeps a count of references held elsewhere. The other heaps send increments and decrements in causal order through a mailbox, and each collector settles its own counts. No collector ever stops another isolate, and no isolate writes into another one's heap. When a task finishes, the isolate that joins it adopts the whole heap, so a large Moved result is not copied on the way back.

## An incremental collector

That protocol needs a collector that can work in steps, and 0.6.6 has one. Marking runs in bounded increments, interleaved with your code. A write barrier keeps the marking correct while your code changes the heap: before a store overwrites a managed field, generated code checks one process-wide flag, and only while a collection is marking does it call the barrier. Stores that initialize a new object never pay for it. Sweeping is lazy and happens as memory is allocated again.

Two environment variables help when something goes wrong. `BESKID_GC_STRESS=alloc:1,verify` collects at every allocation and verifies the heap around each collection, which finds a missing root in seconds instead of in production. The debug runtime kit poisons freed memory and holds it back for a while (`BESKID_GC_QUARANTINE`), so a dangling reference traps instead of reading whatever moved in.

<!-- VERIFY: the incremental-marking pause-bound benchmark (v062 task 9.5) is not written; do not add pause numbers here until it is. -->

## More Rust Glue

0.6.0 let a beskid library call Rust in the same process through a checked C ABI. 0.6.6 widens the boundary:

- A `[GlueRecord]` type with up to 64 scalar fields crosses by value, as a C struct.
- A `[GlueEnum]` without payloads crosses as its variant index. An index the Rust side invents is a checked failure, not undefined behaviour.
- A function type can be a parameter of a Glue import. The callback is valid during the call and on the calling thread.
- The Rust owner crate gets a generated `beskid` module with one function per export, so the Rust side of an export is no longer linked by hand.

## Smaller changes

- `beskid check --project` checks every target of the manifest, test targets included. A source reachable only from a test entry used to pass `check` and fail at `beskid test`.
- The language server offers quick fixes that insert `move` or rewrite a store as `exchange`, and its hover shows the transfer class of a type and the captures of a lambda.
- Attributes are accepted on every declaration, and each attribute declares where it may appear.
- Methods can declare their own type parameters and `where` clauses.

## Before you upgrade

beskid has no users yet, so there is no migration guide. For the record, these changes break existing code:

- Collection mutators consume the collection: write `list = list.Push(v)`.
- Using a Moved value after a consuming use, storing a borrowed Moved value, and passing a Moved argument without `move` are errors.
- `move` is a keyword.
- The seed of `Reduce` must be Shared or Copied.
- Native Mods built by 0.6.0 are rebuilt on the first build.

## What is still missing

- **Benchmarks.** The Savina fork-join and ping-pong benchmarks, the data-parallel comparison with a serial loop and the collector pause measurement are not written yet. Until they are, this post makes no speed claims for the parallel work.
- **Evidence beyond Linux for every scenario.** The isolate, port and sequence tests ran on Linux during development; the release build runs them on all three targets.
- **Signature help** does not show the bindings of a method's own type parameters yet.
- `glue-dotnet` is unavailable, and the Glue stdio bridge stays provisional.

## Install or upgrade

<!-- VERIFY: cli-v0.6.6 release assets, Homebrew formula 0.6.6, VS Code and Zed extension 0.6.6 and the packaging notes must exist and match before publication. -->
On macOS, use the Homebrew tap:

```sh
brew tap cyber-nomad-collective/beskid https://github.com/Cyber-Nomad-Collective/beskid_homebrew.git
brew upgrade cyber-nomad-collective/beskid/beskid
```

On Windows, download the [0.6.6 setup executable](https://github.com/Cyber-Nomad-Collective/beskid_compiler/releases/download/cli-v0.6.6/beskid-0.6.6-windows-amd64.exe). On Linux, download the [AMD64 DEB](https://github.com/Cyber-Nomad-Collective/beskid_compiler/releases/download/cli-v0.6.6/beskid-0.6.6-amd64.deb). The [versioned release](https://github.com/Cyber-Nomad-Collective/beskid_compiler/releases/tag/cli-v0.6.6) also has the Windows MSI and the macOS DMG, and the [native bundles](https://github.com/Cyber-Nomad-Collective/beskid_compiler/releases/tag/v0.6.6) carry a complete installed prefix.

`beskid --version` should print `0.6.6`. `beskid doctor` checks the installation without changing it. The `Core.Parallel` guide in the Corelib documentation has the full API and a cost table for each kind of transfer.
