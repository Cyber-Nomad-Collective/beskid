# Repository Large-File Split Design

## Purpose

Split oversized authored production files across the beskid repository into focused modules while preserving behavior, public APIs, and the project's single-authority invariants. The work is structural: it must not add compatibility layers, duplicate implementations, or revive retired HIR paths.

## Qualification rule

A file qualifies for this program when it is authored production source and either:

- exceeds 1,000 physical lines and contains multiple independently changing responsibilities; or
- exceeds 600 physical lines and contains at least three clear responsibility or lifecycle clusters.

Generated sources, migrations, vendored assets, tests, fixtures, lockfiles, data snapshots, and cohesive declarative catalogues are excluded. Size is a triage signal, not an automatic instruction to fragment cohesive code.

## Target architecture

Each split leaves one small facade or composition root at the original import path. The facade owns public re-exports, stable entry points, and orchestration order. Private modules own complete responsibility clusters and depend inward on shared models/contracts; sibling modules do not call through the facade or duplicate shared helpers.

The target is normally fewer than 800 lines per implementation file. A longer file is acceptable only when it remains one cohesive algorithm or declarative table and the completion audit records that decision.

## Execution model

Work proceeds in waves of up to three non-overlapping source owners. One agent owns each original monolith and all new descendants created from it. Agents may not edit another agent's facade, shared re-export file, or tests. Within a monolith, one owner performs the entire extraction to avoid concurrent deletion/import conflicts.

Temporary uncompilable states are acceptable inside a wave. Cargo commands are forbidden until all files in the wave have reached their intended module structure. Static checks (`rg`, file inventories, brace/delimiter inspection, formatters in check or targeted mode where they do not build) may be used during extraction.

The shared checkout already contains user changes. Agents preserve them, do not reset files, do not commit, and do not add `~/.agents` material to the repository. Each agent records invariants and outcomes under `~/.agents/knowledge/`.

## Initial responsibility map

### Compiler foundations

- `beskid_queries/src/semantic_contract.rs`: facade/model, resolution, locals, typing, calls, ABI, layouts, closures/spawn, syntax facts, completion, and query wrappers. Existing `call_abi` and `layouts` become canonical descendants.
- `beskid_isle/src/lib.rs`: facts/layout contracts, lowering context, generated context implementation helpers, emitter, and public entry points.
- `beskid_pckg_store/src/lib.rs`: migrations, package, community, administration, operations, API keys, cutover, and in-memory repository.

### Compiler services

- `beskid_codegen/src/module_emission.rs`: orchestration, items, trampolines, specialization, imports, tracing, and data emission.
- `beskid_analysis/src/types/checker/expressions.rs`: dispatch/collections, call arguments, nominal types/events, match patterns, and paths.
- `beskid_manifest/src/v5.rs`: model, parsing, validation, Rust/C/assembly generation, and artifact I/O.
- `runtime/beskid/src/Runtime/Mem/Gc.bd`: a small canonical GC facade plus state/allocation, root registry, handles, collection, marking, and sweep units. The compiler-embedded runtime corpus must list every new logical source path exactly once.

### Product and engine surfaces

- `beskid_nexus` coordinators: local MCP backend services, call-resolution pipeline, parse worker phases, server API surfaces, and database adapter concerns.
- `pckg/web/src/router.tsx`: route composition plus vertical public/package/community/account/dashboard/admin modules.
- BSOL syntax/schema/analysis files: scanners/builders, profile/rule/migration loaders, validation, constraints, and value coercion.

### Remaining qualified surfaces

Later waves cover the remaining qualified compiler, pckg server, shared UI, Tracker, Learn, Platform Spec, CI/tooling, and VS Code files from the audit. A fresh LOC/responsibility inventory follows every wave so newly reduced facades and previously deferred cohesive files are evaluated consistently.

## Invariants

- Semantic authority remains generation-bound Salsa/syntax facts.
- Production lowering remains `TypedProgram -> CodegenInput -> ISLE -> stock-verifier-clean CLIF`.
- OpenSpec remains the normative standard authority; Tracker SQLite remains delivery/task authority.
- Shared graph/explorer behavior remains in canonical `@beskid` packages.
- Route paths, query keys, public Rust functions/types, worker messages, diagnostics, and manifest output ordering remain unchanged unless a separate approved behavioral change exists.
- No old implementation remains after its replacement module becomes canonical.
- Rust modules use the narrowest visibility that supports their dependency direction, explicit domain re-exports, idiomatic ownership/borrowing, and no cyclic facade dependencies.
- Beskid runtime modules preserve PascalCase public symbols, existing exported ABI symbols, exact layout offsets, fail-closed traps, and direct canonical-source provenance.

## Verification

Before editing a named symbol, refresh or select the current GitNexus repository index and run upstream impact analysis. HIGH or CRITICAL risks are reported before the edit and the public facade is preserved.

After each wave reaches its intended structure:

1. run `detect_changes` for the affected repository/worktree;
2. audit for duplicate definitions and stale compatibility paths;
3. run formatting checks;
4. run the focused Cargo, pnpm, .NET, or script tests for that wave;
5. fix failures without restoring the monolith;
6. update `CHANGELOG.md` under Keep a Changelog.

Completion requires a repository-wide authored-source inventory proving that every qualifying file was split or explicitly retained as a cohesive exception, plus successful relevant verification gates.
