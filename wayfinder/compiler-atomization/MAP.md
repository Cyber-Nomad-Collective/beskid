## Destination

The compiler shares reusable semantic policies at deliberate seams instead of
repeating conversions and recovery rules in each feature path. Refactors retain
observable compiler behaviour and are independently testable and integrable.

## Notes

- Domain: compiler architecture and duplication removal
- Execution is in scope: each ticket is a small, reviewed compiler commit
- Integration is isolated from the dirty compiler checkout until all selected
  slices have passed targeted verification

## Decisions so far

- [Shared compiler policy seams](tickets/01-shared-policy-seams.md) — target
  metadata lookup, semantic-to-CLIF signatures, and parse-recovery insertion
  policies were selected because each had duplicated local implementations and
  bounded behaviour tests; all three are now integrated on the pushed compiler
  branch with strict workspace Clippy passing.

## Not yet specified

- A second pass can assess duplicate runtime-kit build/run orchestration after
  this branch is merged and benchmarked.

## Out of scope

- Generic-contract and CLI-surface migrations already mixed into the dirty
  compiler checkout; they need their own specifications and release boundary.
