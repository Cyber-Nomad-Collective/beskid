# Design: ownership checker gaps (0.6.7)

Vocabulary (owning name, borrowed name, Moved class, owned expression) comes from `v061-attributes-and-isolate-prerequisites/design.md`, section "Shared vocabulary".

## Rulings

1. Element reads. The original ruling made a returned `xs[i]` of Moved class an error. The owner ruling of 2026-10-24 removes it. Aliasing inside one isolate is allowed, so the return is accepted. At an isolate crossing, a place read such as `xs[i]` is not a valid operand (see `v067-move-at-isolate-boundary`).
2. Export identity. An `[Export]` attribute takes effect only when its name resolves to the compiler-recognized declaration `Core.Attributes.Export`. Each export entry names its declaration by identity, and the linker symbol belongs to a function only when the function is that declaration or a generic specialization of it. Two functions with the same simple name are two identities. An entry that resolves to no emitted function, or to more than one, fails the build. The failure is a build error without a registry code.
3. Scope-borrowed escape. Construction of a `[ScopeBorrowed]` value from a borrowed value stays permitted (0.6.5 ruling). The value itself stays in the scope that uses it. The rule lists five escape forms: return, store into a field or element, aggregate construction, argument of a `spawn` target, and capture by an escaping lambda. A lambda that initializes a `[Captures]`-bounded struct literal field is not an escaping lambda, because the `Core.Parallel` plan pattern needs it.

## Open items

- The plan value `ParallelSeq<T>` is not tracked, so a plan can still be stored or sent after construction. Closing this needs a scope-bound plan type, which is a change to the lazy plans of v065.
