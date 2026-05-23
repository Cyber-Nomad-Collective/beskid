# Handoff — codegen-coverage-dynamic-types (subplanner A7)

- **Track**: `codegen-coverage-dynamic-types` (subplanner A7 of `beskid-v0-3`)
- **Branch**: `orch/beskid-v0-3/codegen-coverage-dynamic-types` (from `main`)
- **Subplan**: `.orchestrate/beskid-v0-3/orch/codegen-coverage-dynamic-types/plan.json`
- **Mission**: dynamic HIR/CLIF + AOT object-to-object mapping + runtime fallback; promote `dynamic-types-and-mapping.mdx` to `Standard` with embedded Decisions; audit `compiler/crates/beskid_codegen` for residual `unimplemented!` / `todo!` sites.

## Status (planner phase)

| Item | State |
| --- | --- |
| Branch created from `main` | done |
| Subplan authored (`orch/.../plan.json`) | done |
| Workers + verifier defined | done (2 workers + 1 verifier) |
| Implementation | pending (delegated to spawned workers) |
| Verification | pending (delegated to verifier) |

Planners do not code. Implementation is delegated to the two workers below; the verifier runs the required test commands at the end of the track.

## Decomposition

### Worker 1 — `dynamic-types-spec-standardization`

Promotes the spec article from `Proposed` to `Standard` with normative content and embedded Decisions. Touches a single MDX file plus the orch directory.

- Allowed paths:
  - `site/website/src/content/docs/platform-spec/compiler/codegen-and-ir/dynamic-types-and-mapping.mdx`
  - `.orchestrate/beskid-v0-3/orch/codegen-coverage-dynamic-types/**`
- Verify: `cd site/website && bun run verify:trudoc -- --preset ci` and `bun run verify:platform-spec-content -- --strict`.

Notes for the worker:

- The article is `specLevel: article`, not a feature hub. The parent track does **not** allow new files under an `adr/` subdirectory of this article, so embed `## Decisions` inline rather than linking out to standalone ADR pages. (The hub-template ADR pattern does not apply here.)
- Spec content must cover (a) HIR/CLIF cell representation, (b) AOT object-to-object mapping rules, (c) runtime fallback rules + deterministic error path, (d) eligibility deferred to Serialization Mod analyzers, (e) embedded Decisions with rationale, (f) Implementation anchors that point at the actual files added by Worker 2 (use repo-relative backtick paths; trudoc's inline-repo-paths plugin will linkify them).
- Update `<SpecPageHeader status="Standard" ...>` and `lastReviewed`. Do **not** edit `serialization.mdx` (out of allowed glob); reference it by link only.
- Escape angle-bracket generics in MDX prose/tables (e.g. `` `Spanned<HirType>` ``).

### Worker 2 — `dynamic-types-codegen-runtime-impl`

Implements the actual codegen, runtime, ABI, and tests. Also captures the codegen audit grep output.

- Codegen surface (new + edits):
  - `compiler/crates/beskid_codegen/src/lowering/types.rs` (extend type mapping for `dynamic`)
  - `compiler/crates/beskid_codegen/src/lowering/expressions/dynamic.rs` (new — cell create / cast / probe lowering)
  - `compiler/crates/beskid_codegen/src/lowering/expressions/mapping.rs` (new — AOT object-to-object mapping for `[Serialize]` shapes)
  - `compiler/crates/beskid_codegen/src/lowering/expressions/serialize.rs` (new — serialize gather/use sites tied to mod-eligible types)
  - `compiler/crates/beskid_codegen/src/services.rs` and `diagnostics.rs` (E-codes for ineligible mapping)
  - `compiler/crates/beskid_codegen/src/lowering/expressions/mod.rs` (wire new modules)
- Runtime surface (new + edits):
  - `compiler/crates/beskid_runtime/src/dynamic/{mod.rs,cell.rs,table.rs,fallback.rs}` (new module)
  - `compiler/crates/beskid_runtime/src/builtins/dynamic.rs` (new) + register in `builtins/mod.rs` and re-export via `lib.rs`
  - `compiler/crates/beskid_abi/src/builtins.rs` and `symbols.rs` (ABI symbols)
- Tests (new):
  - `compiler/crates/beskid_tests/src/codegen/dynamic_types/{mod.rs,...}` wired through `codegen/mod.rs` so `cargo test -p beskid_tests codegen::dynamic_types` selects them
  - `compiler/crates/beskid_tests/src/runtime/dynamic/{mod.rs,...}` wired through `runtime/mod.rs`
  - At least one `#[cfg(test)] mod` inside `compiler/crates/beskid_codegen/src/lowering/...` named so `cargo test -p beskid_codegen dynamic` selects it (mirrors existing internal test scaffolding patterns)
- Audit: capture `rg -n 'unimplemented!|todo!\(|TODO|FIXME' compiler/crates/beskid_codegen/src` output verbatim in the worker handoff. Initial sweep (subplanner phase) shows **zero** residual sites; the worker re-confirms after edits.

Constraints:

- Eligibility is enforced by Serialization Mod analyzers — codegen must consult the analysis signal and raise a structured diagnostic on ineligibility, never silently map.
- Phase A single-mutator: dynamic cell allocations must go through the runtime arena.
- Stay strictly inside `pathsAllowed`; do not touch `composition_policy.rs`, `composition/**`, `extern_call.rs`, `export.rs`, `mod_host/**`, `abfall/**`, or corelib `Collections`/`System` paths.
- Do **not** depend on `compiler-mod-execution` Rust changes landing first; coordinate by reading the Serialization Mod analyzer contract surface in the platform-spec, not by importing in-flight code from the sibling track.

### Verifier — `verify-codegen-coverage-dynamic-types-subtrack`

Runs the three required commands plus the runtime suite and an audit grep, then reports unit-test-verified.

Required commands (mirrors parent `verify` block):

```bash
cd compiler && cargo test -p beskid_codegen dynamic -- --test-threads=1
cd compiler && cargo test -p beskid_tests codegen::dynamic_types -- --test-threads=1
cd site/website && bun run verify:trudoc -- --preset ci
```

Additionally:

```bash
cd compiler && cargo test -p beskid_tests runtime::dynamic -- --test-threads=1
rg -n 'unimplemented!|todo!\(|TODO|FIXME' compiler/crates/beskid_codegen/src
rg -n 'status: Standard' site/website/src/content/docs/platform-spec/compiler/codegen-and-ir/dynamic-types-and-mapping.mdx
rg -n '## Decisions' site/website/src/content/docs/platform-spec/compiler/codegen-and-ir/dynamic-types-and-mapping.mdx
```

## Spec anchors

- `site/website/src/content/docs/platform-spec/compiler/codegen-and-ir/dynamic-types-and-mapping.mdx` (canonical article — promoted to Standard by Worker 1)
- `site/website/src/content/docs/platform-spec/compiler/codegen-and-ir/lowering-contract/index.mdx` (informative — read-only for this track)
- `site/website/src/content/docs/platform-spec/language-meta/metaprogramming/serialization.mdx` (read-only — Serialization Mod analyzer contract)
- `site/website/src/content/docs/platform-spec/language-meta/metaprogramming/compiler-mod-sdk.mdx` (read-only — analyzer signal surface)

## Initial-state notes (subplanner phase)

- Repo root: `/Users/mikserek/Projects/beskid`
- Superrepo HEAD on the new branch matches `origin/main`: **`a3d7cee65699223884abb08ba2b191b72ce60a20`**
- Compiler submodule pointer (read-only at this stage): `6ae272bac6264b196e6d2500138db8981cc1b65f`
- `compiler/crates/beskid_codegen/src/lowering/expressions/dynamic.rs`, `mapping.rs`, `serialize.rs` do **not** exist yet (Worker 2 creates them).
- `compiler/crates/beskid_runtime/src/dynamic/` directory does **not** exist yet (Worker 2 creates it); existing peers under `compiler/crates/beskid_runtime/src/` include `gc.rs`, `channel.rs`, `mutex.rs`, `wait_group.rs`, `slot_table.rs`, `interop_layout.rs`.
- `compiler/crates/beskid_tests/src/codegen/mod.rs` currently wires `lowering`, `diagnostics`, `util`, `descriptors`, `unsupported` (all `#[cfg(test)]`); Worker 2 must add a `dynamic_types` module here.
- `compiler/crates/beskid_tests/src/runtime/mod.rs` wires `alloc`, `channels`, `fibers`, `events`, `guard`, `gc`, `jit`, `jit_callable`, `metrics`, `parity`, `panic_messages`, `sched`, `strings`; Worker 2 adds a `dynamic` submodule alongside.
- Codegen audit (subplanner sweep): `rg -n 'unimplemented!|todo!\(|TODO|FIXME' compiler/crates/beskid_codegen/src` returns **no matches** at the SHA above. Worker 2 re-runs after its edits.

## Acceptance traceability (parent task)

| Parent acceptance line | Owner | Where it lands |
| --- | --- | --- |
| `dynamic` HIR/CLIF representation + runtime round-trip | Worker 2 | `lowering/types.rs`, `lowering/expressions/dynamic.rs`, `runtime/dynamic/`, `beskid_tests/src/runtime/dynamic/`, `beskid_tests/src/codegen/dynamic_types/` |
| AOT object-to-object mapping for ≥2 `[Serialize]` types | Worker 2 | `lowering/expressions/mapping.rs` + `serialize.rs`, codegen integration tests |
| Runtime fallback with deterministic error | Worker 2 | `runtime/dynamic/fallback.rs`, `beskid_tests/src/runtime/dynamic/`, `diagnostics.rs` (E-codes) |
| Spec page Standard with Decisions, eligibility refs analyzers | Worker 1 | `dynamic-types-and-mapping.mdx` |
| Verify cargo + trudoc green | Verifier | three commands above (+ runtime suite, + audit + spec greps) |

## Return artefacts

- **Branch**: `orch/beskid-v0-3/codegen-coverage-dynamic-types`
- **SHA at planner handoff**: filled by the commit message that adds this handoff (see git log on the branch).
- **Subplan**: `.orchestrate/beskid-v0-3/orch/codegen-coverage-dynamic-types/plan.json`
- **Handoff**: `.orchestrate/beskid-v0-3/handoffs/codegen-coverage-dynamic-types.md` (this file)
- **Tests required by parent**:
  - `cd compiler && cargo test -p beskid_codegen dynamic -- --test-threads=1`
  - `cd compiler && cargo test -p beskid_tests codegen::dynamic_types -- --test-threads=1`
  - `cd site/website && bun run verify:trudoc -- --preset ci`

## Follow-ups for downstream

- Aggregator (`aggregate-merge-all`) merges this branch sixth in the documented order. Conflicts in `compiler/crates/beskid_codegen` against `native-di-codegen-runtime`, `export-ffi-link-time`, and `runtime-phase-b-gc-syscall` should prefer the version with most-complete acceptance coverage; this track only adds new files in `lowering/expressions/` and a few targeted edits to `types.rs`, `services.rs`, `diagnostics.rs`, so most conflicts should be resolvable as union merges.
- Aggregator must also union-merge `compiler/crates/beskid_runtime/src/builtins/mod.rs` and `compiler/crates/beskid_runtime/src/lib.rs` between this track and `runtime-phase-b-gc-syscall` / `export-ffi-link-time` / `native-di-codegen-runtime`.
- If the worker discovers that `beskid_codegen` has internal `#[cfg(test)] mod` scaffolding that does **not** match the `dynamic` filter, add a thin internal test file (or extend an existing `lowering/expressions/...` test module) so `cargo test -p beskid_codegen dynamic` selects it. The verifier will fail otherwise.
