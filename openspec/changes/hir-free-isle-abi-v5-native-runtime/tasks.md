## 1. Validate contracts and baseline

- [x] 1.1 Add generation-safe AST/Salsa identities, semantic query signatures, and stale-generation contract tests
- [x] 1.2 Add ABI-v5 manifest, target, layout, trap, assembly, and runtime-kit metadata contract tests
- [x] 1.3 Record the full compiler workspace baseline and first runtime-kit hermeticity failure
- [ ] 1.4 Add retired-pattern and runtime-provenance scans that fail on active HIR or Rust runtime linkage

## 2. Introduce replacement authorities

- [ ] 2.1 Complete indexed expanded-AST semantic facts for resolution, typing, calls, casts, control flow, captures, legality, spans, bodies, and reachability
- [x] 2.2 Add `TypedProgram` construction and the sole `CodegenInput` boundary for project assemblies
- [ ] 2.3 Complete the generated typed-operation inventory and exhaustive ISLE rule compiler
- [x] 2.4 Require stock CLIF verification with originating AST spans for every generated function
- [x] 2.5 Generate exact ABI-v5 allowlists, layouts, traps, and deterministic hashes from `runtime_manifest.bsol`
- [ ] 2.6 Implement canonical Beskid runtime modules and the two target assembly context exports
- [ ] 2.7 Implement runtime-kit build, validation, and exact installed-prefix discovery for all targets and profiles

## 3. Migrate consumers

- [ ] 3.1 Migrate frontend services and project assembly from HIR units to expanded syntax plus Salsa facts
- [ ] 3.2 Migrate LSP document, hover, definition, references, completion, diagnostics, and refresh paths to syntax indexes and semantic queries
- [ ] 3.3 Migrate all codegen expressions, statements, calls, memory operations, control flow, items, and intrinsics to generated ISLE rules
- [ ] 3.4 Migrate JIT and AOT to the same `CodegenInput` and validated ABI-v5 runtime kits
- [ ] 3.5 Migrate corelib runtime facilities to canonical Beskid sources and trusted runtime intrinsic facts
- [ ] 3.6 Migrate CLI, installers, and release bundles to coherent three-target ABI-v5 toolchains

## 4. Delete legacy paths

- [ ] 4.1 Delete HIR types, lowering, normalization, indexing, serialization, caches, adapters, and derives
- [ ] 4.2 Delete Rust `Lowerable` implementations and all legacy/single-unit codegen entry points
- [ ] 4.3 Delete Rust runtime, host, bridge, fallback, Abfall, corosensei, panic, and unwind objects from produced programs
- [ ] 4.4 Delete legacy ABI dispatch, envelopes, registration, adapters, and fallback runtime-kit lookup
- [ ] 4.5 Remove obsolete dependencies, features, generated artifacts, and compatibility documentation

## 5. Verify and release

- [ ] 5.1 Pass analysis, query, document, LSP, codegen, JIT, AOT, runtime, corelib, and full compiler workspace tests
- [ ] 5.2 Pass ISLE coverage, CLIF verifier, ABI allowlist/layout/trap/hash, runtime capability, GC, scheduler, collection, and assembly preservation tests
- [ ] 5.3 Pass debug/release installed-prefix smokes on Linux x86-64, macOS arm64, and Windows x86-64
- [ ] 5.4 Pass retired-pattern, runtime Rust-provenance, dependency, actionlint, package-content, and distribution-order gates
- [ ] 5.5 Update GUIDE, GLOSSARY, CHANGELOG, OpenSpec catalog, implementation anchors, and release-closure evidence
- [ ] 5.6 Run GitNexus changed-scope analysis and whole-branch review before integration
