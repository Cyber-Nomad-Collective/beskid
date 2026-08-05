## Destination

A `clif { ... }` native block expression in Beskid that embeds Cranelift IR directly — enabling the compiler to lower math functions, memory operations, and other performance-critical primitives in pure Beskid without runtime-builtin dependencies. The v0.4 corelib gate passes (61/61 targets green) with all `__math_*` builtins replaced by `clif` blocks in `Core.Math.Math.bd`.

## Notes

- Domain: compiler parser, AST, type checker, ISLE lowering, CLIF codegen
- Skills: codebase-design, tdd, prototype
- This map carries execution — the destination requires build/delivery work, not just decisions
- `builtins.inc.rs` entries for `__math_*` already exist (from ticket 11 resolution); this map replaces them with `clif` blocks
- Each ticket is scoped to one agent session (~100K tokens); agents run in parallel on disjoint files
- **Parser**: `beskid_analysis/src/parsing/` uses a custom combinator system, not Pest — see `beskid_pest_gen` for the grammar DSL

## Decisions so far
- [Parser & AST](tickets/01-parser-ast.md) — `clif { ... }` block syntax, `ClifBlockExpression` AST node, `NodeKind::ClifBlock` classification, full syntax_query/HIR/lowering/normalization/resolution/legality/diagnostics/formatter/walker coverage
- [Type checker](tickets/02-type-checker.md) — opaque to the type checker; returns `Unit`
- [ISLE lowering rule](tickets/03-isle-lowering.md) — `emit_clif_block` ISLE rule in `expressions.isle` dispatches `NodeKind.ClifBlock` to the Rust constructor
- [CLIF emission](tickets/04-clif-emission.md) — `emit_clif_block` constructor parses `call @symbol(%N)` and `return %N`, imports externs via `ExternalName::testcase`, emits CLIF `call`; `clif_block_body` salsa query; `function_param_values` Vec for %N resolution
- [Math rewrite](tickets/05-math-rewrite.md) — all 10 `__math_*` calls in `Core.Math.Math.bd` replaced with `clif { call @floor(%0) }` etc.
- [Tests](tickets/06-tests.md) — 3 golden tests in `clif_block.rs` pass CLIF verifier; `rule_coverage.rs` updated; all 9 coverage tests pass
## Not yet specified

- **Runtime rewrite in pure Beskid** — replacing C/Rust runtime code with Beskid `clif` blocks is a v0.5 concern; this map only covers corelib
- **CLIF block type inference** — v1 is opaque (declared return type); inference is future work
- **Multi-instruction CLIF blocks** — v1 supports single `call` instructions; multi-instruction blocks are future work

## Out of scope

- Full Cranelift IR text parser (cranelift-reader dependency)
- CLIF block control flow (branches, loops) — v1 is expression-only
- Replacing dispatch builtins (str_len, syscall_write, etc.) with CLIF blocks
- Runtime C/Rust code rewrite
