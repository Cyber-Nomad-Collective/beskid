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

## What ROM gives an application

ROM stands for **Resource Oriented Meta Framework**. It is a backend framework written in Rust. Its unit of application design is a *Resource*. Think of a task on a shared board. It has an identity, state that someone can read, and actions such as completing or reopening it. In ROM the developer declares that resource once. The framework uses the declaration to expose its actions, check access, persist state and serve live reads. An action requests a change. An event records the change after the runtime has accepted and committed it.

We want that model inside the beskid runtime. The resource Mod reads a type marked `[Resource]` and its methods marked `[Action]`, then generates a catalog and typed calls. For a task, the catalog tells the host that a client may request completion. The method implements the domain rule, such as whether an archived task can be completed. When the runtime runs that method, it needs to know which values actually changed.

## From a property write to a Resource change

Properties in 0.7.0 give a resource author one place to express what a value means. Consider the setter above. If `Count` is 2 and a client assigns −4, the stored value becomes 0. If the client repeats the assignment, the stored value stays 0. Watching the input would show two writes of −4. Watching the property should show a single transition from 2 to 0.

**For 0.7.1 we plan to add `observe`.** With the proposed syntax, a function that already has the counter can subscribe to changes:

```beskid
observe counter.Count (old, new) => {
    Output.WriteLine("${old} -> ${new}");
};
```

The callback receives the previous and new stored values when the setter changes the backing field. The subscription belongs to this counter. A function can attach a view and return, and the view can still receive later changes while the counter lives. Together, the accessors in 0.7.0 and observation planned for 0.7.1 give the runtime a foundation for its Resource model. The property defines the state, the accessor enforces its rules, and observation supplies the actual transitions during an action.

A local callback can run while an action is in progress. A remote client should see the new revision only after storage commits. Our acceptance scenario starts with two browser tabs showing the same task at revision 1. One tab requests completion. The host checks access, runs the action, and asks SQLite to commit against revision 1. On success, the host publishes revision 2 over WebSocket and the second tab marks the task complete. If another writer won the race, the losing action has no committed revision to broadcast. If the host stops between commit and broadcast, a reconnecting tab can still read revision 2 from storage.

That two-tab flow is the framework we are working toward. The property examples you can run today are in the [Book chapter on properties](/book/03a-the-everyday-language/types-structs-and-enums/#properties).

## Install 0.7.0

The release has a native toolchain archive and a matching VS Code VSIX for each platform. The toolchain includes the CLI, language server, updater, Corelib with prebuilt Mods, and the debug and release runtime kits. After installation, `beskid --version` reports `0.7.0`. [Download packages and VS Code extensions](/downloads/) · [GitHub release and SHA-256 manifest](https://github.com/Cyber-Nomad-Collective/beskid_compiler/releases/tag/v0.7.0)
