<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# REPL command Specification

## Purpose

Interactive snippet evaluator backed by a persistent JIT engine session.

## Requirements

### Requirement: REPL command conformance status
This capability SHALL remain non-conformant and MUST NOT be cited as an implemented Beskid guarantee until a validated OpenSpec change adds explicit behavioral requirements.

**Stable ID:** `BSP-REQ-42BBB43868C9`

#### Scenario: Capability has descriptive material only
- **GIVEN** the migrated sources contain no uppercase BCP-14 obligation or accepted ADR decision
- **WHEN** an implementation reports Beskid conformance
- **THEN** it MUST NOT claim conformance based on this capability

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
