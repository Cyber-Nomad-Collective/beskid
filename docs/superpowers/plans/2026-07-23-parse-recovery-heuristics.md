# Parse Recovery Heuristics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand parser recovery to cover the full Beskid grammar surface via shared repair primitives and four domain generators.

**Architecture:** `services/parse.rs` orchestrates; `services/parse_recovery/` owns primitives and domain `repairs(...)` functions. Candidates are deduped, priority-sorted, capped at 16, then tried with existing strict parse.

**Tech Stack:** Rust, Pest (`beskid.pest`), existing `SemanticDiagnostic` / `bsol_error` / `parse_recovery_diagnostic`.

## Global Constraints

- BSOL diagnostic schema: `Error <code> { Message = "..."; }` only
- One repair per candidate (no cascades)
- Cap 16 unique repaired sources
- Do not change Pest grammar for recovery
- Do not run full test suites unless explicitly asked; agents may use `cargo check -p beskid_analysis` only if needed to unblock compile
- Do not commit unless asked
- Naming: PascalCase types/functions; camelCase locals
- File ownership: each domain agent edits only its assigned file

---

## File map

| File | Owner | Responsibility |
| --- | --- | --- |
| `compiler/crates/beskid_analysis/src/services/parse_recovery/mod.rs` | orchestrator | primitives + aggregate |
| `.../parse_recovery/delimiters.rs` | agent D | delimiter repairs |
| `.../parse_recovery/separators.rs` | agent S | separator repairs |
| `.../parse_recovery/items.rs` | agent I | item/signature stubs |
| `.../parse_recovery/expressions.rs` | agent E | expression/pattern repairs |
| `.../services/parse.rs` | orchestrator | call `collect_repair_candidates` |
| `docs/superpowers/specs/2026-07-23-parse-recovery-heuristics-design.md` | orchestrator | design |

---

### Task 0: Shared scaffold (orchestrator)

- [x] Create `parse_recovery/mod.rs` with `RepairKind`, `RepairCandidate`, `apply_repair`, helpers, `collect_repair_candidates`, re-exports of domain `repairs`
- [x] Stub four domain modules returning `Vec::new()` (or migrate current `;` logic into separators stub)
- [x] Wire `parse.rs` to use `collect_repair_candidates` instead of local insert-semicolon helpers
- [x] `mod parse_recovery` in `services/mod.rs` (private)

### Task 1: Delimiters generator (parallel)

- [x] Implement `delimiters::repairs` for missing/extra `)`, `]`, `}`, `>`, and obvious string/`code` fence closes near `error_pos`

### Task 2: Separators generator (parallel)

- [x] Port and generalize current `;` heuristics
- [x] Add `,`, `:`, `=>`, `::`, `.` inserts at common boundaries

### Task 3: Items generator (parallel)

- [x] Stub incomplete `type`/`enum`/`impl`/`fn`-like/`mod`/`use`/`contract`/`host`/`test` with closers or `;`

### Task 4: Expressions generator (parallel)

- [x] Match arms, lambdas, struct/array literals, call args, pattern list closers

### Task 5: Integrate + docs (orchestrator)

- [x] Priority-merge all generators; verify compile of `beskid_analysis`
- [x] Update `CHANGELOG.md` / `GLOSSARY.md` if terms change
