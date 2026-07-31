## Question

What is the current state of the corelib test matrix — exact pass/fail counts, which packages or test groups are failing, and what is the canonical command to run the full matrix?

Survey the corelib test infrastructure to determine:
1. The canonical command(s) that gate corelib quality (e.g., `just corelib`, specific cargo test invocations)
2. Current pass/fail counts across all packages
3. Which test groups or packages have failures
4. Whether any failures are known flakes vs. real regressions

## Constraints

- The v0.4 article mentions "42/42 matrix" as a goal; determine the actual target count
- Output should be a table: package → pass/fail/skip → canonical gate command
- If a coverage report or dashboard already exists, link it rather than duplicating
