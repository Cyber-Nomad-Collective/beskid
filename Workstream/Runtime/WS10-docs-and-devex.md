# WS10: Docs and Developer Experience

Owner: Runtime + Docs
Status: Planned

## Scope
- Author clear, task-oriented docs for runtime users and contributors
- Keep examples buildable and tested

## Deliverables
- memory-model.md, events.md, ffi.md, runtime-abi-v1.0.md
- Cookbook entries and examples/extern updates

## Tasks
1. Author docs
   - Memory model: roots, GC, barriers, threading
   - Events: semantics, capacity, iteration rules, code snippets
   - FFI: allowed types, libc demos, security controls
   - ABI: symbol table and signatures
2. Examples
   - Strings/arrays/event/scheduler demos under compiler/examples/
   - Extern demos (getpid, write) feature-gated on Linux
3. Doc tests and CI
   - Turn code blocks into doctests where possible
   - CI job to run doctests/examples

## Acceptance Criteria
- Docs complete; examples compile in CI
- Links from workstream plans to docs

## Risks/Mitigations
- Doc rot: tie updates to PRs changing APIs; add ownership labels

## References
- compiler/docs/*
- compiler/examples/*

