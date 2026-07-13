# HIR-Free ISLE/CLIF Native Runtime Design

**Date:** 2026-07-13
**Status:** Approved
**Scope:** Compiler semantic representation, ISLE/CLIF lowering, ABI v5, the hosted native runtime, runtime-kit integration, and the compatibility policy for the rewrite.

This design supersedes the 2026-07-11 HIR/runtime design. The implementation plan in `docs/superpowers/plans/2026-07-13-hir-free-isle-native-runtime.md` is the delivery sequence for this design.

## 1. Locked decisions

| Concern | Decision |
|---|---|
| Semantic representation | Expanded AST nodes plus generation-safe Salsa facts are the only compiler semantic representation. HIR is deleted, not adapted. |
| Lowering | Generated ISLE rules lower typed AST operations to stock Cranelift IR (CLIF); each typed operation has exactly one rule. |
| Runtime boundary | ABI v5 uses direct calls to versioned `beskid_rt_v5_*` symbols. `compiler/runtime_manifest.bsol` is the sole symbol authority and generated `abi.json` contains the exact import/export allowlists. |
| Runtime implementation | One hosted runtime is authored in Beskid and built in debug and release profiles. There are no minimal/standard runtime variants. |
| Privilege | Only the canonical runtime sources receive the trusted runtime-intrinsic capability. User packages cannot request, forge, import, or transitively acquire it. |
| Assembly | Target assembly exports exactly `beskid_arch_v5_context_init` and `beskid_arch_v5_context_switch`; their signatures are declared by the ABI manifest. |
| Targets | Little-endian 64-bit `x86_64-unknown-linux-gnu`, `aarch64-apple-darwin`, and `x86_64-pc-windows-msvc` only. Target metadata, not a universal System V assumption, owns calling convention and pointer representation. |
| Compatibility | This is a big-bang ABI and compiler rewrite. There is no ABI-v4 adapter, HIR bridge, runtime dispatch fallback, dual-write phase, or mixed-kit support. |

## 2. Exact compiler flow

The compiler has one path from source to executable code:

1. Project resolution loads source units and assigns each canonical path a Salsa-interned `SourceUnitId`.
2. Parsing and fixed-point expansion create the expanded AST for a `SyntaxGenerationId`.
3. Every addressable expanded node receives `AstNodeKey { unit, generation, node }`, where `node` is an `AstNodeId`. A key resolves only in its source unit and syntax generation; a stale-generation lookup returns no fact.
4. Salsa queries compute AST semantic facts for resolution, types, signatures, call lowering, casts, control flow, captures, legality, and trusted runtime intrinsics. Facts are keyed by `AstNodeKey`; they never key through HIR or source offsets alone.
5. The analysis boundary produces `TypedProgram { project, entry, generation, assembly }`. `TypedProgram` identifies the validated expanded program and generation; it does not contain or wrap HIR.
6. Codegen receives a `CodegenInput` containing the typed program identity, AST roots/keys, semantic-query database, target metadata, and ABI-v5 manifest. It cannot accept HIR.
7. Generated ISLE terms read syntax shape and semantic facts. Exactly one rule selects each well-typed operation and emits stock CLIF through a narrow Rust context.
8. The Rust context may access queries, manage `FunctionBuilder` lifetimes and module handles, and construct stock CLIF. It may not reimplement language semantics, contain a second pattern matcher, or lower through custom IR.
9. Every generated function passes Cranelift `verify_function` before it may enter a JIT module or AOT object. Missing or duplicate rule coverage and verifier failure are compile errors with source spans.
10. JIT and AOT resolve the same `beskid_rt_v5_*` imports against the matching native runtime kit. JIT loads the shared artifact and retains it for the compiled module's lifetime. AOT links the static or shared artifact selected by the command. Object-only output remains deliberately unlinked and records unresolved ABI-v5 imports.

The LSP uses the same expanded AST indexes and Salsa facts for spans, navigation, diagnostics, hover, and completion. It does not maintain a parallel semantic model.

## 3. HIR-free semantic contracts

The public identity and query boundary uses these exact identities:

- `AstNodeId(u32)` identifies a node only within one expanded unit generation.
- `SyntaxGenerationId(u64)` identifies one expanded syntax generation.
- `AstNodeKey { unit, generation, node }` is the only cross-query node key.
- `SourceUnitId` is Salsa-interned from a canonical `PathBuf`.
- `TypedProgram { project, entry, generation, assembly }` is the analysis-to-codegen program contract.

The semantic database exposes `resolved_item`, `resolved_local`, `node_type`, `call_lowering`, `cast_intents`, `control_flow`, `item_signature`, and `runtime_intrinsic`. Query results for a mismatched unit or generation are absent rather than silently rebound. Cross-unit node numbers may repeat because the full key prevents collision.

Active compiler source must contain no HIR type, lowering, cache, serializer, adapter, linker index, or compatibility path after cutover. Tests may retain the word “HIR” only in retired-pattern assertions and migration history.

## 4. ISLE rule layer

The ISLE rule layer is exhaustive over typed language operations, not merely a peephole pass. Its generated term constructors expose only validated AST shapes and immutable semantic facts. For every typed operation:

- one and only one rule must exist;
- rule selection must be deterministic;
- unsupported or missing coverage must produce a compile-time diagnostic at the operation span;
- the rule must emit stock CLIF values, blocks, calls, loads, stores, and traps;
- no Rust `Lowerable` implementation or fallback match may duplicate the rule.

Build-time coverage generation compares the typed-operation inventory with the ISLE inventory. A missing operation, duplicate operation, unbound semantic fact, or invalid generated CLIF fails the compiler build or source compilation before native code executes.

## 5. ABI-v5 direct-call boundary

`compiler/runtime_manifest.bsol` is the sole authority for ABI-v5 layouts, signatures, platform imports, trusted intrinsics, assembly signatures, and runtime symbols. Generation is deterministic: the same normalized manifest and runtime source set produce identical layout and source hashes and an identical `abi.json`.

All hosted runtime exports use the `beskid_rt_v5_*` namespace. Generated application code calls those exports directly with target-correct signatures. ABI v5 has no dispatch tags, envelopes, handler registration, generic return-group routers, or pointer-as-`i64` convention. The generated `abi.json` is the exact allowlist used to validate application imports, runtime exports, platform imports, and the two assembly exports. This design intentionally does not duplicate the complete function list outside the manifest.

Validation rejects:

- an ABI version other than 5;
- an unsupported target, non-little-endian target, or non-64-bit pointer width;
- duplicate, unversioned, missing, or undeclared runtime symbols;
- layouts or runtime sources whose hashes differ from `abi.json`;
- platform imports not allowed for the selected target;
- an assembly export set other than the two approved symbols;
- a static/shared artifact or profile that does not match the metadata beside it.

ABI or kit validation failure is a build/load error, never a request to try an older runtime.

## 6. Hosted runtime and trusted intrinsic capability

The canonical runtime is Beskid source compiled through the same AST/Salsa → ISLE → verified-CLIF path as user code. Its modules own lifecycle, traps, TLS, allocation, non-moving mark/sweep GC, roots and barriers, collections, strings, concurrency and scheduling, dynamic composition, clocks, callbacks, and target OS adapters.

Some runtime operations cannot be expressed safely by ordinary language code. During canonical runtime compilation, the compiler grants a non-serializable trusted capability after verifying the runtime package identity, source set, and manifest declaration. Only then may `runtime_intrinsic` return an intrinsic fact for an annotated AST node. Generated ISLE rules lower that fact to the manifest-declared primitive or platform import. The capability never appears in package metadata or user-visible name resolution, and dependencies of the runtime do not inherit it.

The runtime has no Rust host, bridge, fallback, Abfall/corosensei dependency, panic path, or unwind contract. Rust compiler processes may build, load, and link artifacts, but no Rust runtime object may be linked into a generated Beskid program.

## 7. Assembly boundary

Architecture-specific assembly contains only the context machinery that cannot be written portably in Beskid:

- `beskid_arch_v5_context_init`
- `beskid_arch_v5_context_switch`

There is one implementation pair for each supported target. The ABI manifest owns their exact signatures and preserved-register contracts. Assembly tests verify stack alignment, callee-saved registers, instruction pointer/stack restoration, first-entry behavior, repeated switching, and sanitizer-friendly unwind prohibition. TLS, allocation, scheduling policy, traps, collections, and OS services remain in Beskid and must not drift into assembly.

## 8. Trap semantics

All runtime traps are terminal. Generated code or the runtime calls `beskid_rt_v5_trap` with the trap code and manifest-declared diagnostic operands; it emits the profile-appropriate diagnostic and terminates the process with exit status 101. It never panics, unwinds, resumes, calls an ABI-v4 handler, or returns to the trapping instruction.

| Code | Name | Meaning |
|---:|---|---|
| 1 | `NullReference` | A required object/reference operand is null. |
| 2 | `Bounds` | An index, slice, or range lies outside its valid bounds. |
| 3 | `ArithmeticOverflow` | A checked arithmetic operation cannot represent its result. |
| 4 | `InvalidUtf8` | Bytes required to form text are not valid UTF-8. |
| 5 | `OutOfMemory` | The runtime cannot satisfy an allocation or reserve request. |
| 6 | `InvalidOrStaleHandle` | A runtime handle is invalid, belongs to another lifetime, or has expired. |
| 7 | `SchedulerDeadlock` | The scheduler proves that no runnable work can make progress. |
| 8 | `AbiOrLayoutMismatch` | Runtime metadata, symbol ABI, or object layout disagrees with the compiled program. |
| 9 | `UnreachableOrIsleInvariant` | Execution reaches an operation the typed program and exhaustive ISLE rules declared unreachable. |
| 10 | `RuntimeInternalCorruption` | A trusted runtime invariant is corrupted and execution cannot continue safely. |

Only codes 1–10 are valid ABI-v5 trap codes. Unknown codes are rejected by manifest validation; corruption that prevents normal validation terminates as code 10.

## 9. Native runtime-kit layout

An installed prefix contains one ABI-v5 kit per target and profile:

```text
lib/beskid-runtime/abi-5/x86_64-unknown-linux-gnu/<debug|release>/
├── abi.json
├── static/libbeskid_runtime.a
└── shared/libbeskid_runtime.so

lib/beskid-runtime/abi-5/aarch64-apple-darwin/<debug|release>/
├── abi.json
├── static/libbeskid_runtime.a
└── shared/libbeskid_runtime.dylib

lib/beskid-runtime/abi-5/x86_64-pc-windows-msvc/<debug|release>/
├── abi.json
├── static/beskid_runtime.lib
└── shared/
    ├── beskid_runtime.dll
    └── beskid_runtime_import.lib
```

The exact filenames are:

| Target | Static | Shared | Shared import library |
|---|---|---|---|
| `x86_64-unknown-linux-gnu` | `libbeskid_runtime.a` | `libbeskid_runtime.so` | none |
| `aarch64-apple-darwin` | `libbeskid_runtime.a` | `libbeskid_runtime.dylib` | none |
| `x86_64-pc-windows-msvc` | `beskid_runtime.lib` | `beskid_runtime.dll` | `beskid_runtime_import.lib` |

`abi.json` records ABI version, target properties, profile, deterministic layout/source hashes, artifact paths and hashes, direct runtime import/export allowlists, platform-import allowlist, layouts, trap table, and exactly two assembly exports. Debug and release are build profiles of the same source corpus and ABI. Profile differences may change diagnostics and optimization, but not symbols, layouts, trap numbers, or observable language semantics.

`beskid_tools runtime-kit build` creates both static and shared artifacts for one target/profile and writes metadata only after validation succeeds. Installed-kit resolution requires an exact ABI, target, profile, and hash match. There is no search fallback to ABI v4 or another target/profile.

## 10. JIT, AOT, and host composition

- **JIT:** validate `abi.json`, load the profile's shared library, validate its exports, bind direct imports, compile verified CLIF, and keep the library handle alive until all compiled code is destroyed.
- **AOT executable:** validate the kit, emit verified objects, generate the ABI-v5 main wrapper, and link the selected static or shared runtime artifact.
- **AOT library:** validate the kit, emit verified objects, generate attach/detach wrappers declared by the manifest, and link the selected runtime form according to the library command.
- **Object-only:** emit the application object and its direct ABI-v5 undefined symbols without linking or embedding a runtime. The consumer must later provide a matching kit.

Host composition occurs through declared ABI-v5 application/library entrypoints and platform-import allowlists. It does not reintroduce generic dispatch envelopes or runtime handler registration.

## 11. Big-bang cutover and deletion

The rewrite lands as one coherent ABI-v5 compiler/runtime/distribution cutover. During isolated task development, untouched legacy code may remain only to keep a contract slice testable; it must be deleted before integration acceptance. The final branch contains:

- no HIR APIs or consumers;
- no ABI-v4 generation, artifacts, symbol lookup, dispatch tags, envelopes, or adapters;
- no Rust runtime crate or linked Rust runtime provenance;
- no legacy runtime profile selection or compatibility flags;
- no generated file edited by hand.

Old installed kits are not considered by ABI-v5 resolution. Existing ABI-v4 binaries remain historical artifacts but cannot be linked, loaded, or incrementally upgraded by the ABI-v5 toolchain.

## 12. Parallel-agent ownership

Agents use disjoint worktrees and write scopes. They do not edit another agent's checkout, generated files, `Cargo.lock`, submodule pointers, or another domain's knowledge file.

| Workstream | Owned implementation area | Required outcome |
|---|---|---|
| Contracts | AST/Salsa identity and query contracts; ABI manifest/model contracts | Generation-safe identities, ABI-v5 validation, deterministic metadata |
| Frontend/LSP | Parser/expansion indexes, semantic queries, analysis services, document/LSP consumers | No HIR semantic consumer; stale keys are inert |
| Codegen | ISLE terms/rules, narrow CLIF context, coverage and verifier gates | Exactly one verified rule per typed operation |
| Runtime/assembly | Beskid runtime sources, intrinsic capability enforcement, three assembly pairs | One hosted runtime; exactly two assembly exports per target |
| Integration | Runtime-kit builder/resolver, JIT/AOT wrappers and lifetime/link logic | Same runtime corpus works in JIT and AOT |
| CI/distribution | Target matrix, bundles, packages, installed-prefix tests | Coherent three-target debug/release delivery |
| Final deletion/docs | Retired-code deletion, normative spec, guide, glossary, changelog, whole-branch audit | No compatibility path or untracked agent artifact |

Each agent records invariants, tests, and remaining integration work in `~/.agents/knowledge/<domain>.md`. Those files are coordination state and must never be staged or pushed.

## 13. Acceptance gates

The rewrite is complete only when all of these gates pass from a clean integration checkout:

1. **Contracts:** deterministic ABI generation; target/layout/source-hash validation; invalid traps, duplicate symbols, wrong assembly sets, and stale/cross-unit AST keys are rejected.
2. **Frontend:** analysis, queries, compiler spine, document, and LSP suites pass; active-source HIR scans are empty.
3. **Codegen:** typed-operation-to-ISLE coverage is bijective; missing coverage carries a span; every generated function passes `verify_function`; no Rust lowering fallback exists.
4. **Runtime:** capability isolation, layouts, imports/exports, traps, allocation/GC, roots/barriers, scheduler, collections, strings, callbacks, and OS adapters pass in debug and release.
5. **Assembly:** preservation and switching tests pass on Linux x64, macOS arm64, and Windows x64; each artifact exports exactly the two architecture symbols.
6. **JIT/AOT:** one runtime conformance corpus passes through JIT, static AOT, and shared AOT; object-only output remains unlinked; installed-prefix resolution rejects every mismatch.
7. **Provenance:** generated programs and runtime kits contain no Rust runtime, panic, unwind, Abfall, corosensei, dispatch-envelope, or ABI-v4 provenance.
8. **Distribution:** each target bundle contains CLI, LSP, debug/release static and shared kits, `abi.json`, checksums, and licenses; package install and smoke tests pass before publication.
9. **Repository:** full compiler/workspace/corelib tests, retired-pattern scans, actionlint, GitNexus `detect_changes`, agent-artifact audit, and whole-branch review pass; generated files are reproducible and the working tree is clean.

No gate may downgrade a mismatch to a warning or select a compatibility path. Publication starts only after the complete three-target matrix is green.
