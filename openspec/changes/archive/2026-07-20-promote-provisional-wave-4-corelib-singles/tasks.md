## 1. Core-library promotions

- [x] 1.1 Delta + promote `core-library--compiler-integration--runtime-registration`
- [x] 1.2 Delta + promote `core-library--stability-and-api-shape--core-syscall`
- [x] 1.3 Delta + promote `core-library--text-and-parsing--text-cursor`

## 2. Skips (document only)

- [x] 2.1 Confirm skip `community--spec-maintenance--architecture` (empty migrated hub)
- [x] 2.2 Confirm skip `standard-governance` (overview-only; no MUST/SHALL)

## 3. Verify

- [x] 3.1 `openspec validate promote-provisional-wave-4-corelib-singles`
- [x] 3.2 Archive with `-y --skip-specs`; confirm the three promoted specs no longer contain `SHALL remain non-conformant`
- [x] 3.3 Confirm skipped specs still provisional (expected)
