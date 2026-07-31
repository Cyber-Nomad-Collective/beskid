## Question

Fix the uncommitted compiler submodule changes that prevent local builds.

## Resolution

**Resolved 2026-07-31.** Two root causes fixed:

1. **`flatten_member_as_path_declaration` missing** — The function was referenced in `call_lowering_for_node` (line 1868) but never defined. Implemented in `beskid_queries/src/semantic_contract.rs` at line 2066. It constructs a synthetic `Path` from the receiver's path segments + the member name and resolves it via `resolve_item_declaration`, enabling module-qualified calls like `Core.IsEmpty(text)` to lower as direct calls.

2. **Clippy warnings blocking `-D warnings`** — Fixed 4 warnings:
   - `unreachable_pattern` at `semantic_contract.rs:1107` (duplicate `Integer` arm — kept `integer_literal_u64` path)
   - `question_mark` at `semantic_contract.rs:1094` (replaced `let...else` with `?`)
   - `collapsible_if` in `facts_node.rs` (collapsed nested if into let-chain)
   - `unused_import` in `object_module.rs` (gated `validate_artifact` behind `#[cfg(debug_assertions)]`)

**Verification:** `cd compiler && cargo build -p beskid_cli --release` passes. `just replace` installs successfully. Runtime kit staged at `~/.beskid/lib/beskid-runtime/abi-5/aarch64-apple-darwin/release`. All `beskid_isle` tests pass (59/59). All `beskid_codegen` isle_adapter tests pass (86/86).
