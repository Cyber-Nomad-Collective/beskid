# Agent F - Post-0.4 ISLE Gaps (Document and Defer)

## Scope
Document known ISLE lowering gaps that are explicitly scoped as post-0.4 or track for post-0.4 per their Linear issue descriptions. These do not block the 0.4 release.

## Issues (3)

| ID | Pri | Title | Status |
|----|-----|-------|--------|
| CYB-178 | High | MethodDefinition has no ISLE lowering rules (HIR bypass) | Backlog |
| CYB-179 | Medium | ForStatement has no ISLE rule for iterator (non-range) iterables | Backlog |
| CYB-180 | Low | RangeExpression has no standalone lower_expression rule | Backlog |

## CYB-178 - MethodDefinition ISLE Gap
- beskid_isle/isle/items.isle:2-5 only handles FunctionDefinition and TestDefinition
- No ISLE rule for MethodDefinition
- beskid_codegen/src/lowering/function.rs:59 - lower_method() bypasses ISLE via HIR
- rule_coverage.rs:76-86 - test asserts production-supported status
- Action: Document as known gap. If HIR retirement (Agent C) proceeds, this becomes a blocker. If HIR retirement is deferred to post-0.4, this can be deferred too.

## CYB-179 - ForStatement Iterator ISLE Gap
- control_flow.isle:31-34 matches only for_iterable_kind (NodeKind.RangeExpression)
- No fallback rule for iterator-based for loops (e.g. for item in collection)
- ast.isle:19 - for_iterable_kind is a partial extractor returning None for non-range iterables
- Action: Track for post-0.4. Add second lower_statement rule for non-range ForStatement case.

## CYB-180 - RangeExpression Standalone ISLE Gap
- RangeExpression only participates through for_iterable_kind extractor path
- No lower_expression rule for standalone range values (e.g. let r = range(0, 10))
- If they ever appear as standalone values, MissingRuleOrFact would be reported
- Action: Track for post-0.4. Intentional for 0.4 scope - range literals only appear in for loops today.

## Deliverable
Create a docs/0.4-release/KNOWN-GAPS.md document listing all three gaps with:
- Issue ID and title
- Current state (what works, what does not)
- Impact on 0.4 (none - these constructs do not appear in corelib or production paths)
- Post-0.4 plan (what needs to be implemented)

## Acceptance
- KNOWN-GAPS.md exists and is linked from the release evidence bundle
- Each gap has a clear deferred to post-0.4 rationale
- No 0.4 release issue references these as blocking
