# BSOL shared pattern constraint RED

The approved v06 BSOL requirement uses the shipped `compiler/corelib/packages/foundation/grammars/regex.pest`, start-zero nonempty matching, all approved escape literals, zero occurrences for optional/star, sequence-aware greedy matching, a1MiB subject limit and default16,777,216 primitive atom/transition/branch steps counted before execution. Caller limits can be checked lower/raised; bounded depth remains required. This is distinct from substring search and from unconstrained external regex implementations.

Source audit found native `Core.Text.Regex.Match` rejects empty results and starts at zero; `Find` separately scans positions. `Engine.MatchPiece` currently requires the first atom before checking optional/star, `MatchQuant` consumes greedily without accepting the remaining sequence, and `MatchEscape` omits grammar-approved escaped braces/colon/quotes. The engine has no checked work counter. These are implementation gaps, not semantics to preserve. Generated Regex.Generated remains a native package generation prerequisite. The root updated the normative change with the explicit rulings and reported strict validation PASS before production changes.

`beskid_bsol/conformance/cases/schema-patterns` contains23 profile/input pairs and digest expectations. Positive cases cover anchors, prefix, groups/alternation/classes/escapes/quantifiers and boundary subject; negatives cover anchored/substring mismatch, empty result, invalid syntax, lookaround/backreferences/counted repetitions, subject limit and nested work exhaustion. The32-level nested quantifier on700,001 subject bytes is valid grammar but exceeds the default work budget when transitions/atoms are counted. A separate six-test caller policy suite uses the ratified PatternLimits{maxSubjectBytes,maxWork,maxDepth} and validate_with_pattern_limits entrypoint. It checks explicit lower work/subject/depth, zero-work exhaustion, addressability bounds, and cumulative work through inline/default nesting without budget reset. Ordinary validate must delegate defaults to the same ValidationContext authority.

Actual independent RED command in `beskid_bsol`:

```
CARGO_TARGET_DIR=<worktree>/.build/bsol CARGO_BUILD_JOBS=2 cargo test -p bsol --test v06_schema_patterns
```

Result: exit101;2passed21failed0ignored;0.66s. Exact log: `.build/v06-bsol-patterns-red.log`. Only anchored-match and prefix-match passed. Invalid patterns loaded successfully; supported constructs failed the digit/contains approximation; anchored/substring invalid values were accepted; native-contract subject/work diagnostic codes were absent. Errors retain source bounds where existing validation returns rejection. Tests cap printed error text to prevent megabyte subject diagnostics obscuring the result.

No Rust production changes, native pattern implementation or native GREEN is claimed. The public caller-limit API and native test gate remain prerequisites; all existing SHA256 and schema fixtures remain intact.

The policy suite reached actual compile RED: `cargo test -p bsol --test v06_schema_pattern_limits` exit101, E0432 unresolved imports `bsol::PatternLimits` and `bsol::validate_with_pattern_limits`; no policy behavior executed. Log `.build/v06-bsol-pattern-limits-red.log`. No production files changed.

## Rust candidate GREEN and source freeze handoff

After observed behavioral and missing-API RED, standalone Rust implements an exact shipped-grammar Pest adapter, checked typed expression model and bounded Thompson matcher. It preserves start-zero/nonempty acceptance while allowing zero optional/star occurrences and acceptance of the remaining sequence. All grammar escape literals are handled. The matcher retains O(pattern-state-count) live state memory, avoiding recursive subject expansion. Work/subject/depth caller policies belong to the existing ValidationContext, which remains authoritative through inline blocks and missing typed defaults. Ordinary validate delegates default PatternLimits.

A focused additional RED proved literal backslash inside a character class could hide excessive group depth from preflight. Preflight now follows actual class grammar (backslash has no class escape authority), and the same test passes. `.build/v06-bsol-pattern-depth-red.log` records the genuine failure.

Final regression command `cargo test -p bsol-schema -p bsol-analysis -p bsol` with isolated `.build/bsol`, jobs2, exited0:70passed0failed0ignored; log `.build/v06-bsol-patterns-regression.log`. The23 shared semantic cases and6 caller-limit cases pass. The cumulative inline test also verifies a standalone pattern fits its bound and the exhausted diagnostic belongs to the second inline field. This establishes standalone Rust behavior, not native parity or cross-target qualification. Source is ready to freeze before compiler consumers rebuild.

The grammar version is pinned by canonical source path/SHA256 and packaged host adapter path in corpus expectations. The copied shipped grammar prefix is exact; only a full-input SOI/pat/EOI host entry is appended. Existing workspace Pest dependencies are declared directly by bsol-schema; no arbitrary regex dependency was introduced.
