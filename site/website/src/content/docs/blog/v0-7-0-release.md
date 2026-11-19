---
title: "beskid 0.7.0: Stack Maps, Properties and a Foundation for Resources"
description: "beskid 0.7.0 gives generated code precise GC roots, adds property accessors, and prepares the compiler and Corelib for a resource-oriented application framework."
date: 2026-11-19
blogStatus: released
release: v0.7.0
draft: false
cover:
  src: "/blog-covers/v0-7-0-release.png"
  alt: "A flock of sheep grazes below wooded hills in autumn."
  sourceHref: "/blog-covers/v0-7-0-release.png"
  sourceLabel: "View original photograph"
---

![A flock of sheep grazes below wooded hills in autumn.](/blog-covers/v0-7-0-release.png)

**beskid 0.7.0 is out for Linux x64, Windows x64 and macOS Apple Silicon.** Generated code now uses Cranelift stack maps to tell the collector which references are live. Types gain properties with backing storage, custom accessors and computed getters. Those changes ship in a toolchain we can use to start building a resource-oriented application framework in beskid.

## What stays alive across a call

If a call can trigger collection, the collector needs to know which values the caller will use when the call returns. Previously, generated code registered stack slots with the collector and removed those registrations along each way out of the function. That made the lowering responsible for keeping the registration lifetime in step with the code.

In 0.7, Cranelift computes liveness and records where the live references land on the stack. Before a call that can trigger collection, generated code publishes a checkpoint that points to the caller’s stack map. The collector uses the same information for a running frame and for a fiber parked by the scheduler. The incremental collector still marks and sweeps, and host code can still hold an explicit handle at the language boundary.

The native tests keep an object alive through a collection in a nested call, through a callback that re-enters beskid, and while a fiber is parked. They also check that the objects become collectible after their last use. Assembling the full macOS package caught another problem. Each stack-map table had its own Mach-O section, and a large compiler Mod ran out of sections. The tables now share a section and retain their links to their respective functions.

## Property access runs the accessor

A property can keep an ordinary stored value or compute its value on read. Here `Count` starts at zero and clamps negative writes. Reading `Double` runs its getter with the current value of `Count`.

```beskid
type Counter
{
    i64 Count
    {
        get;
        set { field = value < 0 ? 0 : value; }
    } = 0;

    i64 Double => Count + Count;
}
```

With `Counter counter = Counter {};`, assigning `3` to `counter.Count` makes `counter.Double` read as `6`. Assigning `-4` makes it read as `0`. Accessors work on generic types and through contract values. VS Code can complete the property name and go to its declaration. The compiler and editor use the same type information for those operations.

## The application we want to build with it

ROM's resource model gives us a concrete starting point. A type declared as a `Resource` describes the state clients can read, and its declared `Action` methods describe the commands clients can send. The proposed framework uses a compile-time Mod to produce a public action catalog and typed dispatch from those declarations. The host would use that catalog to route requests, check access and pass the command to a provider that stores the state and its revision.

The first application has one task and two browser tabs. Both start at revision 1. One tab sends a completion action with that revision. After SQLite commits revision 2, the other tab receives the change over WebSocket and shows the completed task. A rejected action or a failed transaction leaves the revision alone. If the host stops after committing and before sending the update, a reconnecting tab reads revision 2 from the database.

That is a planned acceptance test for the framework. The shipped work gives us the compiler, typed dispatch and serialization machinery to implement it. Work on the framework Mod, SQLite provider and subscription host continues separately, including the public typed JSON and HTTP Upgrade APIs the host needs. Property accessors ship now. Observable property notifications have their own design work ahead.

## Install 0.7.0

The release has a native toolchain archive and a matching VS Code VSIX for each platform. The toolchain includes the CLI, language server, updater, Corelib with prebuilt Mods, and the debug and release runtime kits. After installation, `beskid --version` reports `0.7.0`. [Download packages and VS Code extensions](/downloads/) · [GitHub release and SHA-256 manifest](https://github.com/Cyber-Nomad-Collective/beskid_compiler/releases/tag/v0.7.0)
