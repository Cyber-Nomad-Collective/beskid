## Scope and authority

Accessors and observation are one 0.7.0 delivery. OpenSpec is normative; the research and preview are informative. Typed program facts and established conformance and reachability authorities feed a single property lowering path. No field-to-property compatibility path or alternate semantic authority is introduced; there is no existing property implementation to delete.

## Surface and behavior

```beskid
prop i64 Count = 0;
i64 Limit { get; init; } = 100;
i64 Remaining => Limit - Count;
i64 Clamped { get; set { field = value < 0 ? 0 : value; } } = 0;
observe counter.Count (old, new) => { Handle(old, new); };
```

Within a type, fields, properties and inline methods may be interleaved. The existing semicolon terminates each ordinary type field. Member lookup covers the entire enclosing type, including later declarations. Enum payload fields retain their comma separators.

A bare `prop` synthesizes accessors and storage. An accessor block can mix automatic and custom accessors; `field` and `value` are contextual within the appropriate accessor. `init` limits writes to construction. A default supplies an omitted stored property; required-member and evaluation details need resolution below. Derived expressions are read-only. Ordinary fields are not observable properties.

For an observed stored property, compare the old stored value with the **actual value assigned to `field`**, after the setter has evaluated its expression. Equal values skip the generated store and notification by default; `always` opts out. A setter that performs no backing store emits no notification. Initialization does not notify. Callbacks run synchronously on the writing fiber in registration order, subject to existing event and isolation rules. Primitive equality and a proposed `Equatable` contract provide equality; observed values without applicable equality require `always` or a diagnostic.

An observed derived expression needs a sound dependency set. Opaque calls or any dependency analysis the compiler cannot establish must be diagnosed rather than silently omitted. Exact caching and delivery remain pending.

## First compiler and editor example

The initial executable example covers the automatic shorthand with a typed scalar literal default and an expression-bodied getter. A construction can omit the stored property to take its default or supply the property explicitly. Unsupported initializers produce a diagnostic at the declaration even when no instance is constructed. Property names use the same PascalCase naming convention as methods. The Count / Double example exercises a forward reference, an ordinary field and an inline method. Accessor blocks, contract properties and observation remain separate implementation tasks for 0.7.

## Analysis, layout and runtime

Classify each property per assembled program and concrete specialization. A reachable direct subscription, relevant derived dependency, or observation through a contract value makes every possible target observed. RC4 supports runtime contract values: never assume generic monomorphization eliminates dynamic contract dispatch. Resolve the possible conformers conservatively; if completeness cannot be proved, mark all compatible conformers observed or reject the program. The editor and native lowering consume the same generation-bound semantic facts.

An unobserved automatic property must match an equivalent field's load/store and object layout, with no observation slot, allocation, lookup, comparison or notification branch. A custom body retains its own work. For an observed type, use at most one additional pointer-sized observer handle per instance, shared across its observed properties, initially empty; allocate subscription state on demand. Cached derived state, if selected, is separately accounted for. GC descriptors and barriers must trace the handle and references reachable through subscriptions and derived caches. Do not place an observed instance in storage whose lifetime cannot safely support subscriptions.

## Pending decisions and release gates

These items are unresolved, not guarantees of this draft. Resolve and add normative scenarios before enabling the affected feature in a release:

- Subscription lifetime, cancellation, ownership, callback capture cycles and collection; callback failure and mutation during delivery; reentrant write ordering.
- Derived delivery (push or pull), cache initialization and invalidation, equality, cycles and diamond dependencies; no batching or glitch-free guarantee is implied.
- Foreign exports, separately compiled or dynamically introduced code, and whether an explicit boundary forces observation or is rejected. No foreign raw storage access to a property may bypass semantics.
- Construction ordering, missing defaults, access visibility, exact `init` scope, and whether method-shaped members can satisfy contract properties.
- Equality contract signature, primitive coverage, exact `always` grammar, side effects and diagnostics; handling of custom setters with multiple stores.
- Whether an explicit force-observed annotation is needed and its syntax; layout and ABI policy for separately built artifacts.

## Observability, security and rollback

Expose deterministic property classification and reasons in compiler diagnostics or inspection output, without exposing callbacks or private values. Keep event ordering and existing fiber and isolation boundaries; observation grants no cross-isolate mutation or synchronization. Reject unknown foreign observers and incomplete dependency/conformer analysis rather than emitting an unsound unobserved path. Verify GC reachability without retaining dead subscriptions indefinitely under the eventual lifetime contract. Revert compiler, runtime, corelib, tooling and spec together before release; version and migrate any released surface instead of retaining parallel implementations.

## Stored accessor blocks

The second compiler and editor example replaces the shorthand Count with an automatic getter and a clamping setter. Accessor availability is independent of backing storage. Named entries in type literals initialize storage directly, including get-only and set-only properties. Subsequent reads and writes use the declared accessors. The assigned expression value and the stored value can therefore differ. The broader construction order, init, observation and foreign ABI decisions remain open.

A custom accessor on a generic type uses the concrete type arguments of the receiver, like an instance method. For `Box<T>.Value`, the receiver layout, backing slot, setter input and getter result all use the same substitution. Accesses from a generic caller use that caller’s concrete specialization. Source navigation for all instances refers to the original property declaration.
