## Why

The `contract` construct exists in the Beskid grammar but is not wired to the
type system. Today a contract cannot declare generic parameters, no syntax
links an `impl` block to a contract, generic parameters carry no bounds, and
contract signatures that should return the implementing type resolve to the
contract's own nominal type instead. Conformance is checked structurally but
the comparison is arity-only, so signature mismatches on return type are not
flagged. The corelib carries five fluent this-returning contracts, an empty
`Iterator` marker, seven 0.4-stub glue contracts, and a `Rewriter` contract
that abuses bare identifiers as ad-hoc associated-type stand-ins — all blocked
by these gaps.

This change makes the contract surface a real type-system primitive in one
coordinated delta before implementation continues. It merges four gaps
(generic contracts, `impl`-block conformance, generic bounds, `This` and
associated types) so no duplicated descriptions of the same mechanism exist.
The existing edge-case note at
`openspec/specs/language-meta--contracts-and-effects--contracts/spec.md`
already mentions generic contracts as a deferred case; this change promotes
it to a normative requirement alongside the other three gaps.

## What Changes

- **Generic contracts** — `contract Iterator<T> { ... }` SHALL declare type
  parameters in scope inside method signatures, mirroring `EnumDefinition` and
  `TypeDefinition`. `ContractEmbedding` SHALL supply type arguments when
  embedding a generic contract.
- **`impl`-block conformance** — `impl T : Contract { ... }` SHALL name a
  conformance list after the receiver type, feeding the existing
  `stage6_contracts_and_methods` pipeline. `ImplBlock` SHALL become a first-class
  `Node` variant (no longer flattened to individual `Node::Method` items) so the
  conformance clause is preserved.
- **Generic bounds** — `pub T[] Map<T, U>(T[] xs, U f(T)) where T: Contract`
  SHALL admit a call only if the inferred type conforms to the named contract.
  The bound check SHALL complete inside
  `generic_specialization_instance_for_call` before monomorphization, so ISLE
  sees only conforming concrete types.
- **`This` and associated types** — `This` SHALL be a reserved keyword and a
  `BeskidType` variant referring to the eventual implementing type inside a
  contract body and to the receiver type at an impl site. Contracts SHALL
  declare associated types (`type Item;`) resolved per implementor.
- **Conformance equality upgrade** — the arity-only signature comparison at
  `contracts.rs:167-170` SHALL be replaced with `FunctionSignature`
  (`TypeId`-based)   equality, so return-type mismatches (including `This`) are
  flagged.
- **Generation-bound conformance fact** — the `beskid_queries` semantic-contract
  SOT SHALL mint a conformance query directly from syntax, reused by
  `impl`-block conformance, generic bounds, and `This` substitution.

## Compatibility, migration, and rollout

- `This` becomes a reserved keyword. Source using `This` as an identifier MUST
  be renamed. The receiver value local remains `this` (a regular identifier,
  not a keyword); `self` SHALL NOT be introduced as a keyword or receiver name.
- `impl` blocks that today carry no conformance clause are unaffected; the
  conformance list is optional. Existing `impl T { ... }` parses unchanged.
- `where` becomes a reserved keyword. Source using `where` as an identifier
  MUST be renamed.
- Bare-identifier ad-hoc associated-type stand-ins in `Collect.bd`
  (`TSourceNode`, `TTargetNode`) MUST migrate to declared contract type
  parameters or associated types.
- No catalog regeneration or deployment occurs in this change. Catalog
  generation, site publication, and implementation rollout follow only after
  the compiler evidence gate is green.

## Rollback

Before implementation, this OpenSpec change can be abandoned without runtime or
public artifact rollback because it changes only proposed normative deltas.
During implementation, rollback is one coordinated revert of the grammar,
AST, typechecker, queries, and corelib migration work; partial rollback is
forbidden because it would restore the arity-only conformance check alongside
partial `This` substitution, producing inconsistent conformance validation.

## Impact

- Affected canonical capability: `language-meta--contracts-and-effects--contracts`.
- Affected implementation surfaces: `beskid.pest` grammar, AST nodes
  (`ContractDefinition`, `ContractEmbedding`, `ContractNode`, `ImplBlock`,
  `Type`, `GenericParameter`), typechecker (`items.rs`, `contracts.rs`,
  `helpers.rs`, `types.rs`), resolver (`items_statements.rs`), lowering-prep
  (`substitution.rs`, `walker.rs`), `beskid_queries` semantic-contract
  (`abi/specialization.rs`, `calls/resolution.rs`, `calls/generics.rs`), and
  corelib (`Query/Iterator.bd`, `console/Ansi/Contracts.bd`, `compiler-sdk/.../Collect.bd`).
- ISLE is unaffected: bounds complete before `DirectCallee::SpecializedItem`
  is minted, and `This` substitution reuses the existing specialization path.
- Follow-on: generic combinators in `Query/Operators.bd`, the seven glue
  contract `impl` blocks, and the `Iterator<T>` / `Rewriter<TSourceNode,TTargetNode>`
  rewrites consume the completed contracts.
