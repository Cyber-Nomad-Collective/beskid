<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# REPL command Specification

## Purpose

Interactive snippet evaluator backed by a persistent JIT engine session.

## Requirements

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

## Informative Source Provenance

The records below preserve migration history and are not normative except where text was extracted into a requirement above.

### Source Record: REPL command

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/cli/repl-command/`  
**Source:** `site/spec-content/platform-spec/tooling/cli/repl-command/content.md`  
**SHA-256:** `2a3d3f5cd95db7629476a828ae13be758d25426e31174789561063d776d464e2`

<details>
<summary>Migrated source text</summary>

``````markdown
<SpecSection title="Purpose" id="purpose">
`beskid repl` is the only supported production JIT path after phase 1 of the execution split. It evaluates **single expression or statement snippets** with sub-second re-compile latency using a persistent [`beskid_engine::Engine`](.) session. Project manifests, multi-file modules, and workspace graphs are out of scope for v1.
</SpecSection>

<SpecSection title="Normative behavior" id="normative-behavior">
- Snippets are parsed and type-checked through the same analysis front-end as other CLI commands, but **without** `resolve_input` / project graph wiring.
- Each accepted snippet is lowered and JIT-compiled into the session engine; results are formatted like interim `beskid test` entrypoints (`ok` for `unit`, decimal integers for scalars, lowercase hex for pointer-like returns).
- `:quit` ends the session; `:reset` replaces the engine with a fresh instance.
- Pipeline observers **may** emit `jit.emit` / `jit.finalize` phases; AOT phases **must not** appear on this path.
</SpecSection>

<SpecSection title="Implementation anchors" id="implementation-anchors">
- Crate: `compiler/crates/beskid_repl/`
- CLI wiring: `compiler/crates/beskid_cli/src/commands/repl.rs`
- JIT host: `compiler/crates/beskid_engine/`
</SpecSection>

## Decisions
<!-- spec:generate:adr-index -->
No ADRs published under **`adr/`** yet.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
_No articles in this bundle yet._
<!-- /spec:generate:article-index -->
``````

</details>
