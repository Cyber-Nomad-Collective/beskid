## Why

Editor diagnostics today carry compiler drawings, rule names and repeated paths. Project preparation repeats errors that a file diagnostic already covers. Parse errors have no code. Quick fixes do not say whether a tool may apply them without review. Evidence: wayfinder tickets 02, 03, 04, 05, 08 and 18 of the 0.6.7 map.

## What Changes

- One structured diagnostic with two renderers. The editor renders the editor diagnostic shape (variant B of ticket 03).
- Fix applicability on every quick fix, `Unnecessary` and `Deprecated` tags, labelled related locations.
- Parse codes **E0101**–**E0199** and the unused-item warning **W2101**.
- Mapping of materialized spans to authored sources, and a dedupe rule on code, file and span.
- `--error-format=json` with a stable schema.
- Documentation link for all codes to the registry page.

## Capabilities

### Modified Capabilities
- `tooling--lsp--diagnostics-and-workspace-analysis`, `compiler--semantic-pipeline--diagnostic-code-registry`, `compiler--build-pipeline--diagnostics-parity`, `tooling--cli--command-surface`.

## Impact

`beskid_analysis` diagnostic model, parser error wording, `beskid_queries` project preparation, `beskid_lsp/src/diagnostics.rs`, CLI rendering. Target release: 0.6.7.

## Compatibility, Migration and Reversion

No users exist. Message texts change. Tools that parse human output must use `--error-format=json`. Per-code pages, `beskid explain`, hover and inline rendering, fix-all on save, pull diagnostics and "did you mean" for modules move to 0.7.
