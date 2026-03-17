# M0 — Stdlib Foundation

## Goal
Bootstrap a valid checked-in `standard_library` project skeleton consumable by CLI and compiler workflows.

## Deliverables
- `standard_library/Project.proj`
- `standard_library/Src/Prelude.bd`
- `standard_library/Src/{Core,Collections,Query,System}` directories
- Empty-but-valid module source files for all planned modules.

## Tasks
1. Add project manifest with `Lib` target and `Src` root.
2. Add `Prelude.bd` that publicly declares stdlib modules.
3. Ensure canonical module naming (`Core.*`, `Collections.*`, `Query.*`, `System.*`).
4. Remove any legacy `Std.*` public-path assumptions.

## Acceptance
- `beskid stdlib` can validate the checked-in template.
- No missing manifest/prelude errors.
- All declared module files exist.
