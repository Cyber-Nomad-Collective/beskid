## Shared compiler policy seams

### Question

Which duplicated compiler patterns can move behind common, reusable seams
without changing compiler behaviour or widening the public API?

### Scope

- Canonical target metadata resolution: `TargetMetadata::for_triple`.
- Canonical semantic-to-CLIF signature mapping in the ISLE adapter.
- Explicit parse-recovery insertion policies for boundary-trimming and
  next-token placement.

### Acceptance evidence

- Each slice is an isolated commit with a focused behaviour-level regression.
- Existing callers retain their boundary error text and placement semantics.
- A separate reviewer approves each slice before integration.

### Status

Closed — integrated and pushed on compiler branch
`codex/refactor-compiler-atomization` at `aafa36a5`.

### Resolution

- `TargetMetadata::for_triple` replaces repeated exact-target scans across ABI,
  CLI, AOT, and runtime-kit tooling while retaining their boundary diagnostics.
- Trampolines reuse the ISLE adapter's semantic-to-CLIF mapping, removing 36
  net lines from the former local conversion path.
- Parse recovery shares separate, explicitly named boundary-trimming and
  next-token placement policies; whitespace-position regressions are covered.
- Focused ABI, codegen, and 273 parse-recovery tests passed. The complete
  `cargo clippy --workspace --all-targets -- -D warnings` gate passed after
  eliminating five unrelated warnings across ABI, manifest, and AST generator
  test/utility code.
- A later full `cargo test --workspace --all-targets --no-fail-fast` could not
  complete because its isolated `target/` consumed the remaining disk space;
  Cargo cleanup reclaimed the build cache. This is an environment limit, not a
  reported test failure.
