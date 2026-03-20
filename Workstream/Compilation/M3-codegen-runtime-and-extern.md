# M3: Codegen, runtime integration, and extern

Goals
- Wire missing runtime calls and extern invocation policy

Tasks
- Hook event_* helpers and str_concat to runtime symbols
- Implement extern attribute validation + codegen mapping to ABI/library
- Add tests for item calls vs indirect function calls (lambdas, locals)

Exit criteria
- End-to-end program using extern and events runs in CI

