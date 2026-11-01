## MODIFIED Requirements

### Requirement: Code actions and diagnostic publication for IntelliSense
Code actions SHALL include source formatting for `.bd`, a quick-fix for unused imports (`W1503`) when diagnostic context is present, and documentation actions (generate/update `///` stubs with `@arg` / `@returns` / `@variant` / `@par` where applicable, plus quick fixes for W1610–W1615 and W1620–W1625). Diagnostics SHALL preserve compiler severity/code identity for open buffers and workspace-indexed closed files; for `.bd` files with a document analysis snapshot, published diagnostics SHALL be the union of semantic diagnostics and `doc_diagnostics` (stable sort by span then code).

The LSP SHALL also offer these quick fixes: for **E1237** and **E1242**, insert `move ` before the named binding at the reported span; for **E1239** reported on a borrowed parameter and for **E1241**, insert `move ` before the parameter's type in its declaration; for **E1243**, rewrite `move x.f` to `exchange(x.f, <placeholder>)` with a snippet placeholder for the replacement value. Each fix SHALL be derived from an analysis rewrite and SHALL produce source that the formatter leaves unchanged. Hover on a parameter, receiver or local of Moved class SHALL state `owning` or `borrowed`; hover on a `[Captures]` parameter SHALL show its bound; hover on a lambda passed to a `[Captures]` parameter SHALL list each capture with its transfer class.

#### Scenario: Unused import quick-fix offered
- **GIVEN** a `.bd` buffer with diagnostic `W1503` for an unused import
- **WHEN** code actions are requested at that diagnostic range
- **THEN** a quick-fix for the unused import is included

#### Scenario: Quick fix inserts move
- **GIVEN** a document with the **E1242** diagnostic at `block` in `this.blocks.Push(block)`
- **WHEN** code actions are requested at the diagnostic
- **THEN** one action titled "Insert `move`" is offered whose edit yields `this.blocks.Push(move block)`

#### Scenario: Hover on a borrowed parameter
- **GIVEN** `i64 Checksum(u8[] data) { ... }`
- **WHEN** the client hovers `data`
- **THEN** the hover contains `borrowed` and `transfer class: Moved`

#### Scenario: Hover on a bounded lambda lists captures
- **GIVEN** `Run(() => config.retries + pixel.r)` where `Run` has a `[Captures(Bound: Transferable)]` parameter
- **WHEN** the client hovers the lambda arrow
- **THEN** the hover lists `config: Config (Shared)` and `pixel: Pixel (Copied)`
