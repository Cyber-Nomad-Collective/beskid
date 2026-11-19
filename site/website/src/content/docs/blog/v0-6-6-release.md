---
title: "Inside beskid 0.6.6: More Than One Core"
description: "An engineering report on the 0.6.6 parallel runtime: isolates, transfer classes, ports, parallel sequences, incremental collection and Rust Glue, with qualification still separate from publication."
date: 2026-10-24T09:00:00+02:00
blogStatus: in-progress
release: v0.6.6
draft: false
cover:
  src: "/blog-covers/v0-0-04-compiler-submodule.jpg"
  alt: "An orchestra performing on stage."
  sourceHref: "https://commons.wikimedia.org/wiki/File:Orchestra.jpg"
  sourceLabel: "Orchestra of the 18th Century, Public domain"
---

**The 0.6.6 engineering work takes beskid beyond one core.** It adds isolates with their own heaps, structured parallel tasks and explicit rules for moving values between them.

This is an engineering report, not a release announcement. Public 0.6.6 binaries have not been confirmed, and the work described here should not be read as a claim that a qualified installer is available for every platform. Use the [download page](/downloads/) for verified current builds.

The work planned as 0.6.1 through 0.6.5 was brought together in the 0.6.6 candidate. We planned five steps, and each one depended on the one before it: you cannot share a value between two heaps before the compiler knows which values are safe to share, and you cannot collect a heap that another thread writes to before the collector can work in steps. Shipping the steps one at a time would have meant five releases in which the new parts did nothing on their own. So they were integrated together.

## An isolate owns its heap

A parallel program needs an answer to one question: who may write this object? In beskid, the answer starts with the heap it lives in.

The unit of parallelism is the isolate. An isolate is a runtime instance with its own heap, its own garbage collector and its own fiber scheduler, on its own OS thread. Fibers, channels and mutexes stay inside one isolate, as they did in 0.6.0. Values cross between isolates in three places only: what a task captures, what a task returns, and what goes through a port.

A fork-join scope starts tasks and waits for all of them. This excerpt from the parallel test suite uses its `OrZero` and `ScopeValue` helpers to unwrap results:

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
- **Moved**: it has exactly one owner, and the owner changes when it crosses. Arrays with transferable elements and `[Isolated]` types, including Corelib collections.
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

If you forget the rebinding, the compiler tells you that `list` was moved. This is the change most likely to break code written for 0.6.0. The goal was to prevent two live lists from sharing mutable storage accidentally.

**This describes the 0.6.6 design.** The [planned 0.6.7 update](/blog/v0-6-7-stability/) narrows move checking to isolate boundaries and restores mutating collection methods. The local ownership policy is being revised; the explicit hand-over between isolates remains.

## Ports, pipelines and parallel sequences

A port is a bounded queue between isolates. `Send` parks while the port is full, `Receive` parks while it is empty, and the scope closes its ports when it returns. A Shared value crosses a port by pointer, a Moved value by hand-over, and a Copied value by copy. Pipelines chain stages through ports, and `Ordered()` puts the records of a multi-worker stage back into input order.

A Corelib list also has `.Parallel()`. Another test-suite excerpt uses its `Numbers`, `SumI64` and serial-reference helpers:

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

Two environment variables help when something goes wrong. `BESKID_GC_STRESS=alloc:1,verify` collects at every allocation and verifies the heap around each collection, to help expose missing roots during testing. The debug runtime kit poisons freed memory and holds it back for a while (`BESKID_GC_QUARANTINE`), to make dangling references easier to detect.

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

## Changes to account for

Compared with 0.6.0, the 0.6.6 candidate changes several source and build rules:

- Collection mutators consume the collection: write `list = list.Push(v)`.
- Using a Moved value after a consuming use, storing a borrowed Moved value, and passing a Moved argument without `move` are errors.
- `move` is a keyword.
- The seed of `Reduce` must be Shared or Copied.
- Native Mods built by 0.6.0 are rebuilt on the first build.

## What is still missing

- **Benchmarks.** The Savina fork-join and ping-pong benchmarks, the data-parallel comparison with a serial loop and the collector pause measurement are not written yet. Until they are, this post makes no speed claims for the parallel work.
- **Final release qualification.** Development tests and successful platform runs are evidence about the candidate. Publication still needs the complete gates and packaging evidence for a matching candidate; this report does not assert that process is finished.
- **Signature help** does not show the bindings of a method's own type parameters yet.
- `glue-dotnet` is unavailable, and the Glue stdio bridge stays provisional.

## Where to go next

The [download page](/downloads/) lists verified current builds, and the [installation guide](/docs/getting-started/install/) covers the native toolchain prerequisites. The [language standard](/docs/standard/) remains the authority for language and runtime contracts.

The next step is making this machinery dependable in the editor and in ordinary projects. That is the focus of the [planned 0.6.7 stability update](/blog/v0-6-7-stability/).
