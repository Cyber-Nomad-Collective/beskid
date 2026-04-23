# M0 — Corelib Foundation

## Goal
Bootstrap a valid checked-in `beskid_corelib` project skeleton consumable by CLI and compiler workflows.

## Deliverables
- `beskid_corelib/Project.proj`
- `beskid_corelib/Src/Prelude.bd`
- `beskid_corelib/Src/{Core,Collections,Query,System}` directories
- Empty-but-valid module source files for all planned modules.

## Tasks
1. Add project manifest with `Lib` target and `Src` root.
2. Add `Prelude.bd` that publicly declares corelib modules.
3. Ensure canonical module naming (`Core.*`, `Collections.*`, `Query.*`, `System.*`).
4. Remove any legacy `Std.*` public-path assumptions.

## Acceptance
- `beskid corelib` can validate the checked-in template.
- No missing manifest/prelude errors.
- All declared module files exist.
