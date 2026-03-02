# Attribute Extension Implementation Plan

## Goal
Extend attributes as a first-class language feature while keeping generator work in draft scope. The main extension is declaration-level target constraints and a unified attachment model across AST/HIR.

## Scope
### In scope
- Attribute declaration target list syntax:
  - `attribute Builder(TypeDeclaration, MethodDeclaration) { ... }`
- Unified attribute attachment model for all attributable syntax/HIR nodes.
- Semantic legality and type checks for attribute applications.
- Diagnostics and regression tests.

### Out of scope
- Generator execution/runtime.
- Incremental generator scheduling.
- Macro/runtime reflection features.

## Desired language behavior

## 1) Declaration syntax and semantics
- Attributes are top-level declarations.
- Optional declaration target list constrains valid application targets.
- Parameter declarations remain typed and may include default values.

Example:
```beskid
pub attribute Builder(TypeDeclaration, MethodDeclaration) {
    suffix: string = "Builder",
    enabled: bool = true,
}
```

## 2) Application semantics
- Application name must resolve to an attribute declaration.
- Named arguments must map to declared parameters.
- Required parameters must be provided unless default exists.
- Duplicate argument names are errors.
- Argument expression type must match parameter type.
- If declaration has target constraints, application node kind must be included.

## 3) Canonical target kinds (v0.1+)
- `TypeDeclaration`
- `EnumDeclaration`
- `ContractDeclaration`
- `ModuleDeclaration`
- `FunctionDeclaration`
- `MethodDeclaration`
- `FieldDeclaration`
- `ParameterDeclaration`

---

## Architecture plan

## Phase 0: Baseline and checkpoints
1. Capture current parser/syntax/HIR/type-test baseline.
2. Identify all syntax nodes that currently carry `attributes` and all nodes that should.
3. Confirm existing diagnostics IDs for E1801-E1805 are stable.

Exit criteria:
- Baseline test suite status documented.
- Target node inventory complete.

## Phase 1: Grammar and parser updates
1. Extend `AttributeDeclaration` grammar to support optional target list after name.
   - `attribute Name(TargetA, TargetB) { ... }`
2. Add grammar rule for `AttributeTarget` tokens (identifier set constrained semantically).
3. Parse target list into AST node field.
4. Keep backward compatibility for declarations without target list.

Implementation notes:
- Parser should preserve source spans for each target entry for precise diagnostics.
- Unknown target names should produce parser or legality diagnostics (prefer legality for better messages).

Exit criteria:
- Parsing works for both constrained and unconstrained declarations.
- Parsing regression tests added.

## Phase 2: AST model unification (syntax layer)
1. Add/extend a shared attribute attachment pattern for attributable syntax nodes.
2. Ensure all attributable nodes expose identical attribute collection shape.
3. Avoid per-node bespoke parsing logic for attribute lists; use one helper path.

Suggested pattern:
- Shared helper used by all attributable node parsers.
- Optional trait/utility (`HasAttributes`) for read-only traversal convenience.

Exit criteria:
- Attribute retrieval is uniform across syntax nodes.
- No duplicated attribute-list parsing logic remains in attributable item parsers.

## Phase 3: HIR model and lowering
1. Extend `HirAttributeDeclaration` to carry parsed target constraints.
2. Lower syntax target list into canonical HIR target enum.
3. Keep attribute applications as typed expression values (already in place).
4. Ensure every attributable HIR node keeps same attribute container shape.

Exit criteria:
- HIR contains declaration targets with stable spans.
- Lowering tests validate syntax-to-HIR target mapping.

## Phase 4: Resolver and symbol integration
1. Register attribute declarations with target metadata in symbol tables.
2. Keep declaration-only behavior for attribute declarations where applicable.
3. Ensure lookup APIs return full declaration metadata (params + targets).

Exit criteria:
- Attribute resolution returns complete metadata.
- No regressions in existing name resolution behavior.

## Phase 5: Legality and typing checks
1. Extend legality checks:
   - declaration target identifiers must be valid target kinds.
   - no duplicate targets in declaration list.
2. Extend application checks:
   - target compatibility: application site kind must be allowed.
3. Keep/enforce existing argument checks (E1802-E1805).
4. Add dedicated diagnostic for target mismatch.

Recommended new diagnostic:
- `E1809 AttributeTargetNotAllowed`
  - Trigger: attribute is applied to a node kind not listed in declaration target list.
  - Message includes: attribute name, actual target kind, allowed target kinds.

Exit criteria:
- All attribute legality diagnostics include precise source spans.
- Target mismatch is enforced in analysis pipeline.

## Phase 6: Services and query integration
1. Update AST/HIR query node kinds if target metadata introduces new node shapes.
2. Expose attribute declaration targets in analysis services APIs (hover/symbol/introspection as needed).
3. Ensure downstream consumers (interop/codegen helpers) remain compatible.

Exit criteria:
- Query/service layers can inspect target-constrained attributes.
- Existing tools do not regress.

## Phase 7: Test plan (required)

## Parser tests
- Declaration without targets.
- Declaration with one target.
- Declaration with multiple targets.
- Invalid target token/name.
- Duplicate target in declaration.

## Syntax/HIR tests
- AST contains declaration target list with spans.
- HIR target enum mapping is correct.
- Attributable nodes expose uniform attributes shape.

## Analysis tests
- Unknown attribute declaration reference (E1801).
- Unknown argument (E1802).
- Missing required argument (E1803).
- Duplicate argument (E1804).
- Argument type mismatch (E1805).
- Target mismatch (E1809).

## Integration/regression tests
- Existing `[Extern(...)]` behavior remains stable.
- No regression in module/contract/type analysis passes.

Exit criteria:
- Full attribute matrix passes for each target kind × diagnostic class.

## Phase 8: Documentation + migration notes
1. Keep lexical/spec docs aligned with target-list syntax and supported placements.
2. Document best practices:
   - prefer typed enums/bools over stringly-typed discriminators.
   - prefer explicit declaration targets for safety.
3. Add migration note from legacy unconstrained declarations.

Exit criteria:
- Spec/docs examples and diagnostics are consistent.

---

## Delivery slicing

## Slice A (Minimal, low risk)
- Parse target lists.
- Lower to HIR.
- Validate target compatibility.
- Add parser + legality tests.

## Slice B (Model cleanup)
- Complete shared syntax/HIR attachment refactor.
- Add traversal/query convenience APIs.

## Slice C (Hardening)
- Diagnostic polish, span precision, and full matrix tests.
- Documentation and migration examples.

---

## Risks and mitigations
1. **Risk:** duplicated attribute handling paths across nodes.
   - **Mitigation:** central parser helper + shared attachment shape + lint/tests.
2. **Risk:** target naming drift between parser, HIR enum, and diagnostics.
   - **Mitigation:** single canonical `AttributeTargetKind` mapping function.
3. **Risk:** regressions in existing extern attribute lowering.
   - **Mitigation:** keep extern compatibility tests mandatory in CI.

## Completion checklist
- [ ] Grammar updated and tested.
- [ ] AST/HIR models updated with target constraints.
- [ ] Resolver/type/legality passes updated.
- [ ] E1809 implemented and tested.
- [ ] Docs updated and cross-linked.
- [ ] Full regression suite green.
