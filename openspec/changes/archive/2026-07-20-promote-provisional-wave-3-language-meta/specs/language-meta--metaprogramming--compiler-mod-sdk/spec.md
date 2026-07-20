## ADDED Requirements

### Requirement: Mod SDK contract hierarchy
The Compiler Mod SDK (`compiler-sdk` package) MUST be the Beskid-side surface for `type: Mod` projects. Mod behavior MUST be declared through SDK `contract` interfaces (`Collector`, `Generator`, `Analyzer`, `Rewriter`, `AttributeGenerator`) and `Beskid.Syntax` operations — not through dedicated metaprogramming grammar items in the host language. Hosts MUST discover contract implementations from AOT-compiled `Mod` packages in the dependency graph (direct and transitive).

#### Scenario: Mod declares Collector and Generator
- **GIVEN** a `type: Mod` package with public types implementing `Collector` and `Generator`
- **WHEN** a host project depends on that package
- **THEN** the mod host discovers those contract implementations from the AOT artifact without manifest entrypoint registration

### Requirement: Artifact-driven contract discovery
During `mod.load`, the mod host MUST resolve every transitive `type: Mod` dependency, locate the AOT artifact for the active target triple and cache key, read the export descriptor and/or native export table, and build a schedule of `(contractId, typeId, entrySymbol)` tuples. Duplicate or conflicting registrations MUST fail with **E1829** / **E1851–E1870** before `mod.collect` runs. Missing required contracts for a scheduled mod MUST fail closed (no partial host merge). Manifest `attachTo` / `entryModules` MUST NOT be part of discovery; `Collector` owns scope narrowing at execution time.

#### Scenario: Duplicate contract registration
- **GIVEN** two export registrations that conflict for the same contract entry
- **WHEN** `mod.load` builds the contract schedule
- **THEN** the host emits **E1829** or **E1851–E1870** and does not run `mod.collect`

### Requirement: Beskid.Syntax traversal and no source emission
`Beskid.Syntax.Nodes.Node` MUST be a contract that is the sole navigation surface for mod traversal via `NodeRef` handles with stable identities per syntax generation. Mod code MUST build and transform trees through declarative fluent APIs with no string formatting or source-text emission. Language macros are not Mod contracts; they expand via `macro.expand` before `mod.load`.

#### Scenario: Generator emits typed AST only
- **GIVEN** a `Generator` contract implementation
- **WHEN** it contributes to the host program
- **THEN** the contribution is typed AST (not formatted source text) and may be re-expanded for embedded language macros after re-parse

## REMOVED Requirements

### Requirement: Compiler Mod SDK conformance status
**Reason**: Replaced by explicit behavioral requirements extracted from migrated source.
**Migration**: Cite the ADDED requirements above.
