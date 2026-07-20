## ADDED Requirements

### Requirement: Snippet evaluation without project graph
`beskid repl` SHALL evaluate single expression or statement snippets through the same analysis front-end as other CLI commands, but MUST NOT wire `resolve_input` or the project graph. Project manifests, multi-file modules, and workspace graphs are out of scope for v1.

#### Scenario: Snippet type-check without project graph
- **GIVEN** a running `beskid repl` session
- **WHEN** the user submits a single-expression snippet
- **THEN** the snippet is parsed and type-checked through the shared analysis front-end without resolving a project input graph

### Requirement: Persistent JIT session and result formatting
Each accepted snippet SHALL be lowered and JIT-compiled into a persistent `beskid_engine::Engine` session. Results MUST be formatted like interim `beskid test` entrypoints: `ok` for `unit`, decimal integers for scalars, and lowercase hex for pointer-like returns.

#### Scenario: Scalar snippet result
- **GIVEN** a REPL session with a fresh engine
- **WHEN** the user evaluates a snippet that returns a scalar integer
- **THEN** the engine JIT-compiles the snippet into the session and prints a decimal integer result

### Requirement: Session control and JIT-only pipeline phases
`:quit` SHALL end the REPL session. `:reset` SHALL replace the engine with a fresh instance. Pipeline observers MAY emit `jit.emit` / `jit.finalize` phases; AOT phases MUST NOT appear on this path.

#### Scenario: Reset replaces engine
- **GIVEN** a REPL session that has already accepted one or more snippets
- **WHEN** the user enters `:reset`
- **THEN** the session replaces the engine with a fresh instance

#### Scenario: No AOT phases on REPL path
- **GIVEN** pipeline observers attached to a REPL evaluation
- **WHEN** a snippet is JIT-compiled
- **THEN** observers may see `jit.emit` / `jit.finalize` and MUST NOT observe AOT phases

## REMOVED Requirements

### Requirement: REPL command conformance status
**Reason**: Replaced by explicit behavioral requirements extracted from migrated source.
**Migration**: Cite the ADDED requirements above.
