# Compilation Workstream Plan

Scope
- End-to-end compiler pipeline parity with spec; fill missing features.

Milestones
- M0: Frontend (parser + HIR) validation vs spec
- M1: Name resolution, contracts, and typing gaps
- M2: Control flow + iteration + patterns parity
- M3: Codegen + runtime integration + extern
- M4: Optimizations and tooling polish

Core gaps to close (from current codebase review)
- ForStatement lowering (iterator contract + range fast-path)
- Try operator semantics (typing + codegen)
- Extern attribute validation + ABI-constrained lowering
- Capturing closures that escape (fat-pointer env) or diagnose appropriately

Acceptance
- Spec examples compile and run
- Tests for for/try/extern/lambdas cover success and diagnostics paths

