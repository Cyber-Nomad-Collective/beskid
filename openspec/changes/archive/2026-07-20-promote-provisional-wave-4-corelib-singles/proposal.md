## Why

CYB-57 (Cursor wave E) covers the remaining provisional core-library feature
capabilities plus two singles that still carry "SHALL remain non-conformant"
stubs. Three of five have extractable BCP-14 obligations in Migrated source;
two lack enforceable obligations and must stay provisional rather than receive
invented stubs.

## What Changes

- Promote three core-library capabilities to explicit SHALL/MUST requirements
  extracted from each capability's Migrated source text.
- Remove each promoted capability's single "SHALL remain non-conformant"
  requirement and its provisional Stable ID line.
- Keep Informative Source Provenance blocks unchanged.
- Skip `community--spec-maintenance--architecture` and `standard-governance`
  (no uppercase obligation or accepted ADR in migrated provenance).

## Capabilities

### Promote

- `core-library--compiler-integration--runtime-registration`
- `core-library--stability-and-api-shape--core-syscall`
- `core-library--text-and-parsing--text-cursor`

### Skip (no extractable SHALL)

- `community--spec-maintenance--architecture` — empty hub; no normative prose
- `standard-governance` — overview-only; no MUST/SHALL obligations

## Impact

- Catalog provisional count drops by three after a later `openspec:catalog` run
  (out of scope for this change).
- Book and Tracker may cite the three promoted requirement sets once archived.
- No implementation code changes in this wave.
