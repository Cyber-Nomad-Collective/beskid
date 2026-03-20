# M3 — Contract Conformance Engine

## Goal
Make explicit `type T : ContractA, ContractB` conformance first-class and drive contract obligations + call classification from it.

## Syntax decision (normative)
- Conformance declarations use colon syntax only:
  - `type T : ContractA { ... }`
  - `type T : ContractA, ContractB { ... }`
- `when` conformance syntax is fully removed.
- No backward compatibility path is supported for `when` as conformance syntax.
- No parser, lowering, resolver, type, or diagnostic logic may preserve legacy `when` behavior.

## Execution model decisions (normative)
- Contract dispatch must be executable in backend/runtime (JIT + AOT), not metadata-only.
- Contract values use fat representation: `(data_ptr, vtable_ptr)`.
- Dispatch uses deterministic slot-indexed indirect calls through the contract vtable.
- Obligation flattening for embedded contracts follows declaration order.
- Embedded duplicate methods with identical signatures are coalesced; conflicting signatures are errors.
- Concrete -> contract coercion is implicit only when declared conformance exists.
- No ad-hoc conformance by naming conventions is allowed in any phase.
- Generic conformance extensions are deferred unless required by acceptance tests.

## Current grounded status
- Contract diagnostics exist for missing methods/signature mismatch:
  - `analysis/diagnostic_kinds.rs` (`E1601`, `E1602`, `E1606`)
- Conformance lists are carried through syntax/HIR/lowering and resolved into resolution metadata.
- Declared conformances drive obligation expansion and `E1601`/`E1602` checks with conformance-span mapping.
- Type call classification includes `ContractDispatch` metadata for contract-typed receiver calls.
- Remaining gap: backend/runtime path still needs executable `ContractDispatch` lowering (currently metadata-only).

## Task list
1. Enforce syntax canonicalization in parser/docs/tests:
   - accept `:` only
   - reject `when` (no compatibility mode)
2. Complete executable contract dispatch path in backend/runtime:
   - define contract value ABI (`data_ptr`, `vtable_ptr`)
   - lower `ContractDispatch` calls to executable indirect dispatch
3. Build/confirm obligation expansion:
   - include embedded contracts
   - flatten required method signatures in deterministic declaration order
4. Validate each declared conformance against impl methods:
   - missing method -> `E1601`
   - signature mismatch -> `E1602`
   - conflicting embedded contract obligations -> semantic error
5. Feed conformance metadata into call classification where contract-typed dispatch is required:
   - `types/context/expressions.rs`
   - downstream lowering metadata consumption
6. Implement coercion checks for concrete -> contract values:
   - permit only with declared conformance
   - reject non-conforming conversions in type analysis

## Acceptance criteria
- Explicit conformance declarations are parsed, lowered, resolved, and enforced.
- Existing contract diagnostics map to declared conformance source spans.
- No ad-hoc contract satisfaction by naming conventions alone.
- Contract-typed calls are executable in backend/runtime (not metadata-only).
- `when` conformance syntax is rejected everywhere with no legacy compatibility behavior.

## Test targets
- `crates/beskid_tests/src/analysis/legality.rs`
- `crates/beskid_tests/src/analysis/pipeline/core.rs`
- `crates/beskid_tests/src/analysis/types.rs`
- `crates/beskid_tests/src/codegen/*` and runtime/JIT coverage for contract-typed dispatch execution.
- Add/extend contract-specific negative tests for obligation failure and mismatched signatures.
- Add strict parser negative tests proving `when` conformance syntax is rejected.
