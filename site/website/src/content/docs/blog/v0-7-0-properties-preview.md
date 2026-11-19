---
title: "beskid 0.7.0: Reactive Properties and the Golden Mean"
description: "A preview of reactive properties, the trade-offs behind their design, and the compiler, tooling and runtime work carried into the 0.7 roadmap. Familiar accessors, explicit observation, and costs the AOT compiler can account for."
date: 2026-10-24T11:00:00+02:00
blogStatus: in-progress
release: v0.7.0 preview
draft: false
cover:
  src: "/blog-covers/v0-7-0-properties-preview.png"
  alt: "A historical drawing of a centrifugal governor: rotating weights and a linkage regulate the flow of steam."
  sourceHref: "https://commons.wikimedia.org/wiki/File:Centrifugal_governor.png"
  sourceLabel: "R. Routledge, 1900, Public domain"
---

**The 0.7.0 design brings properties and observation together.** A type should be able to expose a value, control writes to it, derive another value from it, and let interested code react when it changes. Ordinary data should remain cheap to store and read.

This is a preview of work in design and development. The syntax below is proposed, and the wider roadmap includes work carried forward from earlier versions. The [standard](/docs/standard/) remains the authority as those decisions become reviewed requirements.

The [0.6.6 work](/blog/v0-6-6-release/) dealt with separate heaps and parallel execution. The [0.6.7 stability work](/blog/v0-6-7-stability/) takes that machinery back to the editor and asks whether writing an ordinary program feels reasonable. The next question is what the language should do for the state inside that program. Updating a progress value should not require a small private framework. Nor should every record become a reactive runtime object just because a different part of the application has a user interface.

That is the territory for 0.7.0: reactive properties, stronger semantic foundations, and the gaps that real programs have exposed.

## A value with an interface

A plain field remains a plain field. It has storage and a layout. A property adds declared read and write behavior, and the short form should be short enough to use without regretting it:

```beskid
// Proposed members inside a type.
prop i64 Count = 0;
i64 Limit { get; init; } = 100;
i64 Remaining => Limit - Count;
```

`prop` identifies the bare automatic form. When an accessor block or `=>` already identifies a property, the keyword can be omitted. `get`, `set` and `init` describe the access available to callers; the default follows the accessor block. A derived property expresses a value in terms of other members.

Custom accessors can use the contextual names `field` and `value`, so adding behavior does not require declaring a second, manually synchronized backing field:

```beskid
// Proposed setter: keep a count non-negative.
i64 Count {
    get;
    set { field = value < 0 ? 0 : value; }
} = 0;
```

The point is a useful public surface. Callers can keep reading `counter.Count` when its implementation grows a validation rule. A getter-only property exposes a value without offering arbitrary writes. An initialization-only property constrains when assignment is allowed. A contract can require an accessor shape such as `i64 Count { get; }`, so an algorithm can depend on a readable value without dictating its storage.

Construction rules, visibility and foreign-boundary behavior still need precise specification. They are part of making this feature coherent, rather than a reason to turn every use into a collection of library conventions.

## Observe the change where it matters

The other half of the feature is observation. Code that cares about a change should say so directly:

```beskid
use Core.Output;

// Proposed observation syntax; counter is an existing instance.
observe counter.Count (old, new) => {
    Output.WriteLine("Count changed.");
};
```

The proposed default gates an observed write on equality: compare the old and new values, and skip the generated update and notification when they are equal. When they differ, store and notify. Primitive equality covers simple values. A proposed `Equatable` contract gives other types an explicit equality rule, and an `always` modifier covers properties that deliberately notify on every assignment. This avoids quietly inventing an equality operation for an arbitrary type.

Notification would follow the existing event model: handlers run on the writing fiber, in registration order. That makes the execution point understandable. A subscription does not secretly move the work to another thread or establish synchronization across isolates. The [events contract](/docs/standard/capabilities/language-meta--evaluation--events/) and the existing concurrency boundaries are the foundations here.

Derived properties belong in the same picture. `Remaining` depends on `Limit` and `Count`; the compiler can see those reads in its expression. An observed derived property can use cached state and invalidation instead of making application code maintain the same dependency twice. The draft restricts that analysis to dependencies the compiler can establish. Opaque method calls must not silently turn into an incomplete dependency graph.

The exact delivery rules for derived changes, subscription lifetime and re-entrant writes need to be settled in OpenSpec. Batching, scheduler policy and UI bindings also need clear contracts. A subscription mechanism alone does not establish glitch-free updates across a whole graph, and this preview makes no such guarantee.

## What should an unused property cost?

Here is the part that makes this a beskid feature rather than a spelling exercise.

One straightforward implementation puts an observer slot beside every property. Another gives every object a registrar, even if the program never subscribes. Both are understandable designs. Both make ordinary objects carry infrastructure that some applications will never use.

beskid's proposed approach uses the information its AOT build already gathers. Dependencies are assembled from source, generic code is specialized, and reachable code is known before native emission. The compiler can classify each property declaration according to whether reachable code observes it.

For an unobserved automatic property, the target is the same load and store as a plain field: no observer allocation, lookup or notification branch. A custom accessor still has the cost of its own body. Observation cannot make validation or computation disappear.

For a type with observed properties, the proposal adds one hidden observer handle per instance, shared by those properties. Subscription storage is allocated when needed. Stored-property getters can remain direct reads, while observed writes perform the equality and notification work. Observed derived properties additionally need their cached value and invalidation state.

The distinction is per declaration across the assembled program. If some reachable code observes `Counter.Count`, an instance with no current subscribers can still have the observed layout and setter checks. “Nobody subscribed to this particular object” is weaker than “the compiler proved this property is never observed.”

These are design obligations to verify in generated code. The intended evidence is a comparison of unobserved properties with equivalent fields, alongside tests of notification and GC scanning. There are no performance numbers to announce yet.

## What other languages teach us

The useful ideas already exist in several places. The trade-off is how they fit together.

| Approach | What it makes convenient | What beskid takes from it |
| --- | --- | --- |
| C# properties and MVVM tooling | Familiar accessors, backing storage and generated change notifications. | Readable member syntax and explicit accessor behavior, integrated with the language's observation model. |
| Swift Observation | Declaring observable models and tracking the properties that consuming code reads. | Observation as a property-level concern, with shared registration machinery per object. |
| Kotlin delegated properties | Reusing behavior such as observation through a delegate. | A compact declaration that avoids repeating setter plumbing. |
| Qt bindable properties | Expressing dependencies and keeping derived values synchronized. | A concrete model for relationships between properties and for accounting for management storage. |
| Signal libraries | Convenient computed values, effects and batching. | Explicit dependencies and reactive composition, while keeping the language's ordinary member surface. |

In C#, the [property syntax](https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/properties) gives accessors a first-class place in the language. Observable application models commonly add infrastructure around it. The [CommunityToolkit generator](https://learn.microsoft.com/en-us/dotnet/communitytoolkit/mvvm/generators/observableproperty) removes much of the repeated equality-and-notification code. That is a good developer-experience lesson: the machine should write the ceremony.

[Swift Observation](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0395-observability.md) brings model observation and access tracking together through macros and an observation registrar. [Kotlin's delegates](https://kotlinlang.org/docs/delegated-properties.html) make reusable property behavior explicit; `Delegates.observable` invokes a handler after assignment. These mechanisms have their own semantics. Neither should be reduced to “another language has properties too.”

[Qt's bindable properties](https://doc.qt.io/qt-6/bindableproperties.html) make the storage question particularly visible: `QProperty` holds a value and a management pointer, while `QObjectBindableProperty` uses management storage on the enclosing object. [Preact Signals](https://preactjs.com/guide/v10/signals/) illustrates the appeal of computed values and effects in a reactive application. Those conveniences explain why people reach for a graph in the first place.

beskid's particular opportunity is to combine an ordinary property interface with a whole-program observation decision. That does not establish that these languages cannot optimize their implementations. It states what beskid intends to make an explicit, testable compiler contract.

## Aurea mediocritas

The golden mean here is a deliberate allocation of responsibility.

The **language** owns properties, accessors, contracts and the meaning of observation. The **compiler** owns dependency facts and the removal of unused observation machinery. **Corelib** can build scheduling, batching and bindings on those rules. Application code declares the values and relationships it needs.

That gives us a useful middle ground between repeating notification boilerplate in every model and treating all application state as nodes in an always-present reactive graph. A service's ordinary data remains ordinary data. A progress model can expose an observable `Percent`. A derived label can follow the values it reads. All three use the same type system.

The limit matters as much as the convenience. Foreign code cannot introduce invisible observers behind the compiler's back; exported access needs an explicit policy. Observation does not grant cross-isolate shared mutation. Equality must be defined. Hidden storage must be visible to the collector. A feature this convenient needs unusually boring answers to those questions.

## The OpenSpec work underneath it

Properties also touch work already present in OpenSpec proposals. The active contract-system proposal covers generic contracts, declared conformance, generic bounds, `This` and associated types. It replaces weak signature matching with typed conformance facts. Property requirements need to fit that same semantic authority, rather than create a second way to decide whether a type satisfies a contract.

The [contracts capability](/docs/standard/capabilities/language-meta--contracts-and-effects--contracts/) is the public reference point. The proposal is groundwork to reconcile with the 0.7 design; an open change is not, by itself, a promise that every task in it ships in 0.7.0.

The reachability-scoped semantic-legality work supplies another relevant foundation: facts must describe the reachable, assembled program. Observation analysis should use that authority too. It must produce a deterministic answer that the editor, diagnostics and native lowering can agree on.

This is also where syntax reflection, formatting, hover and completion belong. A property should be understood by the tools as a property, with its accessors and contract requirements intact. Generating machine code is only one part of delivering a language feature.

## The work coming forward from 0.6

The 0.7 roadmap is wider than properties. The stability programme deliberately moved several pieces out of 0.6.7 so that the final 0.6 update could finish. They remain work to do, with their own specification and evidence requirements.

**Diagnostics and the daily workflow.** The 0.6.7 foundation includes structured errors, labelled locations, repair applicability and JSON output. The proposed continuation includes `beskid explain`, per-code explanations, richer editor help, workspace diagnostics and safe fix-all workflows. The compiler should be able to explain a problem once, and the terminal and editor should present the same explanation. The [diagnostic registry](/docs/standard/capabilities/compiler--semantic-pipeline--diagnostic-code-registry/) is the shared vocabulary.

**The edges exposed by beskid-lings.** Value-producing blocks in match arms, raw terminal input and key events, filesystem listing and timestamps, and a less awkward manifest and Corelib-materialization experience are in the carried-forward scope. Better wording for “unsupported” is useful; implementing the missing operation is a different piece of work. The course has been a good way to find that distinction repeatedly.

**GC precision and parallel-plan lifetimes.** Precise stack maps are already an obligation in the [memory and GC contract](/docs/standard/capabilities/execution--runtime--memory-and-gc-runtime-contract/). Completing that implementation belongs in the 0.7 programme. So does closing the lifetime gap for a stored lazy parallel plan that contains scope-borrowed data. The plan value itself must not outlive the scope simply because its execution is deferred. That builds on the earlier ownership work and the decision to keep move checking at isolate crossings.

**Compiler and command-line follow-through.** A type resolver written in beskid is part of the direction, alongside further CLI ergonomics and dependency-workflow research. The CLI work should make routine operations discoverable and dependency edits predictable. Exact commands and release commitments still need to be established; a research suggestion is not a public command contract.

**Measurements.** Fork-join, ping-pong and data-parallel comparisons, plus collector pause measurements, were carried into 0.7 as evidence work. They should tell us where the implementation stands. They cannot be used as speed claims before they have run.

These items explain the direction of the programme. Their final assignment within that programme follows reviewed OpenSpec changes and integration evidence. The reactive-property design presented here is one complete 0.7.0 proposal, including observation; the broader backlog should remain visible without pretending it has all been delivered.

## What would make this a good release?

A small model should read like the state it represents. A subscription should make the reaction visible. A program that never observes a property should be able to prove that it paid no observation cost. The editor should understand the same feature the compiler emits.

That is the golden mean we are aiming for: familiar surface syntax, explicit semantics, and an implementation whose costs can be inspected. The standard and the tests will have to make that argument as convincingly as the examples do.

For the current toolchains, see [Downloads](/downloads/). For the work immediately before this design, read the [0.6.7 stability update](/blog/v0-6-7-stability/).
