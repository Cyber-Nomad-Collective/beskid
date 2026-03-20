# WS6: Panic/IO and Diagnostics (miette-first)

Owner: Runtime + CLI + Analysis
Status: Planned

## Scope
- Ensure panic/IO paths are consistent and human-readable
- Route all CLI parse/semantic errors via miette; avoid raw pest output
- Consider wrapping runtime panics surfaced via CLI in a clean miette preface

## Deliverables
- panic-and-io.md with messages/codes policy
- CLI commands (parse, clif, run, build) pre-parse and miette-print errors (done)
- Optional: runtime error wrapper that converts panics to structured diagnostics for CLI display

## Tasks
1. Panic consistency
   - Audit panic! calls in runtime; uniform messages and contexts
   - Add snapshot tests for panic strings
2. CLI miette enforcement
   - Pre-parse stage in commands (done) and ensure no alternate error prints
   - Add golden tests for stderr formatting
3. Runtime-to-CLI error wrapping (optional)
   - Catch and format runtime panics at CLI boundary with helpful context

## Acceptance Criteria
- No non-miette pest/parse output on CLI
- Panic messages consistent and documented

## Risks/Mitigations
- Over-wrapping panics obscures debugging; keep raw backtraces opt-in via env

## References
- compiler/crates/beskid_cli/src/commands/*.rs
- compiler/crates/beskid_runtime/src/builtins/*

