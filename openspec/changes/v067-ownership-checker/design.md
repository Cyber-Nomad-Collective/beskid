# Design: ownership checker gaps (0.6.7)

Vocabulary (owning name, borrowed name, Moved class, owned expression) comes from `v061-attributes-and-isolate-prerequisites/design.md`, section "Shared vocabulary".

## Rulings

1. Element reads. `xs[i]` on a Moved element class is a place read. It produces a borrowed name, like `let e = blocks[i]` in `v062-captures-and-move`. The existing rule "A borrowed name SHALL NOT be returned" already covers a named borrow. The gap is the direct form `return xs[i];`, which the checker treated as an owned expression. The change closes the gap with the existing code E1241 and a new help text. No new code is allocated.
2. Export identity. The attribute `[Export]` is a property of one declaration. The runtime registrar and the entry table SHALL key on the declaration identity (module path plus declaration), not on the simple name. Two functions with the same simple name in different modules are two identities.
3. Scope-borrowed escape. The 0.6.5 ruling allows a borrowed value inside a field of a corelib `[ScopeBorrowed]` type. This change keeps that ruling for construction and adds the escape rules for the view itself. A value of a `[ScopeBorrowed]` type, and any borrowed value stored in it, SHALL NOT outlive the scope of the terminal that created it. The checker enforces this and no longer trusts corelib review alone.

## Open items

- The diagnostic code for an unresolved `[Export]` identity is chosen by the implementation slice and recorded in its progress file.
