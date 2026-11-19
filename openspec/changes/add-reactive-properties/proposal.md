## Why

A model currently needs hand-written accessors and notification plumbing to expose validated or observable state. Beskid needs a first-class property interface whose unobserved automatic form carries no observation overhead.

## What Changes

- Target **0.7.0** for properties and observation together: automatic, custom, initialization-only and derived accessors, defaults, contract requirements, `observe`, equality gating and `always`.
- Compute observation conservatively over the reachable assembled program, including runtime contract values and all possible conformers. Specify testable AOT layout and GC obligations.
- Preserve ordinary fields as plain data. `prop` is required for the bare automatic form; an accessor block or expression body identifies a property without it.
- Complete the unresolved decisions in design.md before accepting the corresponding normative delta or releasing the feature. This draft does not claim that the compiler already implements it.

## Capabilities

### New Capabilities

- `language-meta--type-system--reactive-properties`: property declarations, access, observation, conservative analysis and conformance evidence.

### Modified Capabilities

The existing type, contract, events, runtime memory and tooling capabilities must be reconciled with this delta as implementation lands. The existing contract-conformance authority remains the source of truth.

## Compatibility, Migration and Reversion

New reserved words and member forms can conflict with existing identifiers; inventory and diagnose conflicts and document any required source migration. Fields retain their existing meaning; changing one to a property is an explicit source change and may affect layout and exported interfaces. Source dependencies are rebuilt with the program; foreign ABI policy is unresolved and must fail closed until specified. Existing public standard URLs do not change and require no legacy URL migration. Reverting before release removes the new syntax and runtime support together; after release, removal is a breaking language and ABI change requiring an explicit migration decision, not silent fallback.
