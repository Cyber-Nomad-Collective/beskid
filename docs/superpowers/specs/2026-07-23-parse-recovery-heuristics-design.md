# Parse Recovery Heuristics Design

## Decision

Expand Beskid parser recovery from semicolon-only inserts to full-grammar coverage using **shared repair primitives** and **domain-specific candidate generators**. Public parse APIs continue to prefer recovered AST + `parse.recovery` BSOL warnings when a small text repair restores a valid Pest+AST parse.

Approach **A** (approved): one primitive module + four parallel domain generators.

## Codebase facts

| Concern | Current state | Required change |
| --- | --- | --- |
| Recovery entry | `parse_program_with_source_name_and_diagnostics` in `services/parse.rs` | Keep orchestrator; move candidate generation out |
| Repairs today | Only `insert_semicolon` at error/next-token/EOF | General `Insert` / `Delete` / `Replace` |
| Diagnostics | `bsol_error` / `parse_recovery_diagnostic` | Unchanged schema |
| Grammar authority | `beskid.pest` | Generators informed by delimiter/separator/item/expression shapes |
| Strict path | Pest OK + AST fail still hard-errors | Preserve |

## Architecture

```text
parse.rs (orchestrator)
  └─ parse_recovery/
       ├─ mod.rs          — RepairKind, RepairCandidate, apply, collect, try loop helpers
       ├─ delimiters.rs   — ()[]{}<> string/code fence closers
       ├─ separators.rs   — ; , : => :: .
       ├─ items.rs        — incomplete type/enum/impl/fn/mod/use/contract/host/test
       └─ expressions.rs  — match/lambda/literals/calls/patterns
```

### Shared primitives

- `RepairKind::{ Insert { text }, Delete { len } }` (compose replace as delete+insert if needed later)
- `RepairCandidate { position, kind, reason, priority }`
- Helpers: `apply_repair`, `skip_ws`, `next_token_start`, unbalanced delimiter scan
- Cap: at most 16 unique repaired sources per recovery attempt
- Priority: lower number tried first (delimiters before separators before stubs)

### Domain generators

Each exports `fn repairs(source: &str, error_pos: usize, parse_error: &pest::error::Error<Rule>) -> Vec<RepairCandidate>`.

One repair per candidate; no multi-edit cascades in v1.

### Diagnostics

Recovery warnings continue as:

```text
Error parse.recovery {
  Message = "...";
}
```

## Success criteria

1. Incomplete sources across the four domains yield `ParsedProgram { recovered: true, ... }` when a single primitive repair restores parse.
2. Existing semicolon recovery still works via the separators generator.
3. Strict APIs remain recovery-default (callers that need hard-fail can be added later as `*_strict`).
4. No change to BSOL message schema.

## Non-goals

- Error-node AST insertion / HIR tolerance
- Multi-step cascading repairs
- Changing Pest grammar rules for recovery
