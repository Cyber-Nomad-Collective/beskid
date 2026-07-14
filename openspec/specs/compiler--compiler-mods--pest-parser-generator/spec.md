<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# Pest parser generator Specification

## Purpose

Compiler mod and host codegen that turns Pest .pest grammars into Beskid combinator parsers.

## Requirements

### Requirement: Embedded Pest grammars carve-out: Decision [D-COMP-MODS-0020]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> Project-local `.pest` files compiled by **GrammarGenerator** parse **text DSLs only**. They **must not** replace or extend `beskid.pest`. Conformance fixtures **must** prove host surface unchanged.

**Stable ID:** `BSP-REQ-DB38B6D44A0B`  
**Legacy source:** `site/spec-content/platform-spec/compiler/compiler-mods/pest-parser-generator/adr/0001-embedded-pest-carve-out/content.md`  
**Source SHA-256:** `1d71ab5bf67f59370d5deafddfcb4a43afefd59a4701844c8e519576c03246b8`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

## Informative Source Provenance

The records below preserve migration history and are not normative except where text was extracted into a requirement above.

### Source Record: Pest parser generator

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/compiler-mods/pest-parser-generator/`  
**Source:** `site/spec-content/platform-spec/compiler/compiler-mods/pest-parser-generator/content.md`  
**SHA-256:** `e32070e1c9a08da5ac428d522b26865df6c09e161fd66cf9b10d1f94d23e1cd4`

<details>
<summary>Migrated source text</summary>

``````markdown
<SpecSection title="Contract statement" id="contract-statement">
Projects with `type = Mod` **may** register a **`GrammarGenerator`** contract. At `beskid mod rebuild`, the host schedules **`corelib_pest_gen`** (or another grammar mod), which uses **`Core.Text.Pest`** to read `grammars/**/*.pest` and emit Beskid combinator parsers via [Core.Text.Parser](/platform-spec/core-library/text-and-parsing/text-parser-combinators/) (**PARSER-005** naming). Legacy Rust **`beskid_pest_gen`** remains a temporary golden bridge until Beskid emit is AOT-ready. Embedded grammars **must not** modify host [`beskid.pest`](/platform-spec/compiler/front-end/parser-and-ast-contracts/) (see ADR carve-out).
</SpecSection>

<SpecSection title="Implementation anchors" id="implementation-anchors">
- `compiler/corelib/mods/corelib_pest_gen/`
- `compiler/corelib/packages/foundation/src/Core/Text/Pest/`
- `compiler/crates/beskid_pest_gen/` (temporary bridge; retire per design model)
- `compiler/crates/beskid_tests/fixtures/mods/pest_gen_mod/`
</SpecSection>

## Decisions
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMP-MODS-0020`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Contracts and edge cases](./articles/contracts-and-edge-cases/)
- [Design model](./articles/design-model/)
- [Examples](./articles/examples/)
- [FAQ](./articles/faq-and-troubleshooting/)
- [Flow and algorithm](./articles/flow-and-algorithm/)
- [Verification](./articles/verification-and-traceability/)
<!-- /spec:generate:article-index -->
``````

</details>

### Source Record: Embedded Pest grammars carve-out

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/compiler-mods/pest-parser-generator/adr/0001-embedded-pest-carve-out/`  
**Source:** `site/spec-content/platform-spec/compiler/compiler-mods/pest-parser-generator/adr/0001-embedded-pest-carve-out/content.md`  
**SHA-256:** `1d71ab5bf67f59370d5deafddfcb4a43afefd59a4701844c8e519576c03246b8`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

D-COMP-FRONT-0012 requires a single host `beskid.pest` surface. Corelib needs embedded DSL parsers (markup, regex).

## Decision

Project-local `.pest` files compiled by **GrammarGenerator** parse **text DSLs only**. They **must not** replace or extend `beskid.pest`. Conformance fixtures **must** prove host surface unchanged.

## Consequences

- Clear boundary: host parser vs embedded grammars.
- `beskid_pest_gen` is not an alternate Beskid front-end.

## Verification anchors

- `compiler/crates/beskid_analysis/src/beskid.pest` unchanged by mod rebuild
- `compiler/crates/beskid_tests/fixtures/mods/pest_gen_mod/`
``````

</details>

### Source Record: Contracts and edge cases

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/compiler-mods/pest-parser-generator/articles/contracts-and-edge-cases/`  
**Source:** `site/spec-content/platform-spec/compiler/compiler-mods/pest-parser-generator/articles/contracts-and-edge-cases/content.md`  
**SHA-256:** `4f1d39a28ffead3a1ae3a6f1617d2394cde4fb8fc4b5d1eec11a4c66902e4641`

<details>
<summary>Migrated source text</summary>

``````markdown
## Normative requirements

| ID | Requirement |
| --- | --- |
| **GRAM-001** | Output **must** use `Core.Text.Parser` combinators only. |
| **GRAM-002** | Generated modules **must** land under `.beskid/obj/mods/<id>/generated/`. |
| **GRAM-003** | Host `beskid.pest` **must not** be modified by mod grammars. |
| **GRAM-004** | Unsupported Pest constructs **must** emit **E18xx** with actionable messages. |
| **GRAM-005** | Canonical grammars `regex.pest` and `console_markup.pest` **must** ship with corelib/console packages. |
``````

</details>

### Source Record: Design model

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/compiler-mods/pest-parser-generator/articles/design-model/`  
**Source:** `site/spec-content/platform-spec/compiler/compiler-mods/pest-parser-generator/articles/design-model/content.md`  
**SHA-256:** `bc29cb34f0c6ace004fd86df82c544c2655ab66c39d3781e82d93d52996388b9`

<details>
<summary>Migrated source text</summary>

``````markdown
## Components

| Component | Role |
| --- | --- |
| **`Beskid.Compiler.Collect.GrammarGenerator`** | Mod contract: registers `.pest` roots via `Collector`; emits combinator modules on fingerprint miss |
| **`Core.Text.Pest`** | Beskid library: parse Pest grammar text, lower to combinator AST, emit `Core.Text.Parser` call sites |
| **`corelib_pest_gen`** | Reference `type = Mod` package (`PestCollector`, `PestGen`); emits `CodeContribution` outputs materialized to `.generated/{modulePath}/{fileName}.g.bd` |
| **`grammar { }` block** | Consumer `.bproj` declares Pest roots and output module paths (camelCase keys; see [project manifest contract](/platform-spec/tooling/manifests-and-lockfiles/project-manifest-contract/)) |
| **`mod.descriptor.json`** | Adds `generatedModules` entries with output paths |

The host **must not** embed Pest-specific emission logic in Rust. Parse and emit authority lives in **`Core.Text.Pest`**; scheduling and disk materialization live in the **`corelib_pest_gen`** mod.

## Core.Text.Pest layout

| Module | Role |
| --- | --- |
| **`Core.Text.Pest.Grammar`** | `GrammarRule { string name, string expression }` |
| **`Core.Text.Pest.Expr`** | `PestExpr` variant tree (`Literal`, `RuleRef`, `Seq`, `Choice`, …) |
| **`Core.Text.Pest.Names`** | `RuleNameToCallable`, `RuleNameToPascal` |
| **`Core.Text.Pest.Emit`** | `EmitCombinatorModule`, `EmitRuleBody`, `EmitRuleCallable` |
| **`Core.Text.Pest`** | Hub re-export |

| Legacy Rust (`beskid_pest_gen`) | Normative Beskid |
| --- | --- |
| `parse_grammar_rules` | `ParseGrammarRules` |
| `emit_combinator_module` | `EmitCombinatorModule` |
| `Parse_{rule}` | `Parse{PascalRule}` (for example `ParsePatBranch`) |

## RuleNameToCallable mapping

Pest rule names remain **snake_case** on disk (Pest idiom). Emit time **must** map them to PascalCase Beskid callables via `RuleNameToCallable`:

| Pest rule | Callable |
| --- | --- |
| `digit` | `ParseDigit` |
| `pat_branch` | `ParsePatBranch` |
| `lower_run` | `ParseLowerRun` |

Mapping rules:

1. Split snake_case segments; capitalize each segment and concatenate (`lower_run` → `LowerRun`).
2. Prefix with configurable callable prefix (default `Parse` from `pestGenConfig.ruleCallablePrefix`).
3. Emit locals as **camelCase** (`choice0`, `seqCur`) per **PARSER-005**.

Diagnostic `rule` strings in `ParseResult::Err` **may** keep the original Pest spelling.

## Rust `beskid_pest_gen` retirement

`compiler/crates/beskid_pest_gen/` is a **temporary golden bridge** only—it is **not** naming authority. The crate **must** be removed from the workspace after:

1. `Core.Text.Pest.EmitCombinatorModule` output for canonical fixtures (for example `regex.pest`) matches current `Generated.bd` semantics.
2. Emitted symbols satisfy **PARSER-005** (no `Parse_[a-z]` callables, no `_[a-z0-9]+` locals).
3. `corelib_pest_gen` mod rebuild replaces `regen_grammar_parsers.sh` in CI.

Until removal, conformance tests **may** diff Rust bridge output against Beskid emit as a migration gate.

## Supported Pest subset

Rules, `~` sequence, `|` choice, `*`/`+`/`?` repeat, string/char literals, rule references. Modifiers `_`, `@`, `$`, `!` mapped per Pest docs. Left recursion **must** be rejected (**E18xx**).

## Implementation anchors

- Beskid emit: `compiler/corelib/packages/foundation/src/Core/Text/Pest/`
- Mod package: `compiler/corelib/mods/corelib_pest_gen/`
- Legacy bridge (retire): `compiler/crates/beskid_pest_gen/`
``````

</details>

### Source Record: Examples

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/compiler-mods/pest-parser-generator/articles/examples/`  
**Source:** `site/spec-content/platform-spec/compiler/compiler-mods/pest-parser-generator/articles/examples/content.md`  
**SHA-256:** `4d702f523ef619874145d07d794024b389c67f46f00af2bb2d05d0e370384150`

<details>
<summary>Migrated source text</summary>

``````markdown
## Example manifest

```
mod {
  capabilities = [read_project_sources, emit_syntax]
  grammarRoots = ["grammars"]
}
```
``````

</details>

### Source Record: FAQ

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/compiler-mods/pest-parser-generator/articles/faq-and-troubleshooting/`  
**Source:** `site/spec-content/platform-spec/compiler/compiler-mods/pest-parser-generator/articles/faq-and-troubleshooting/content.md`  
**SHA-256:** `947d988b49b1611cb4e5148abf37a2199158862ddb22039b0b12fef87f913dbb`

<details>
<summary>Migrated source text</summary>

``````markdown
## FAQ

### Why host Rust for codegen?

`pest_derive` is compile-time only; mods orchestrate, host emits.
``````

</details>

### Source Record: Flow and algorithm

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/compiler-mods/pest-parser-generator/articles/flow-and-algorithm/`  
**Source:** `site/spec-content/platform-spec/compiler/compiler-mods/pest-parser-generator/articles/flow-and-algorithm/content.md`  
**SHA-256:** `b1dac7cf5f52a110a6d74630ec2759c502921d0adabb13f16798a03c17a18ffe`

<details>
<summary>Migrated source text</summary>

``````markdown
## Flow

1. Consumer project declares `grammar { roots, grammarOutput }` in `.bproj`.
2. `beskid mod rebuild` builds the grammar mod AOT artifact (`corelib_pest_gen`).
3. On fingerprint miss, the mod's `GrammarGenerator` uses `Core.Text.Pest` to parse `.pest` sources and emit combinator `.bd` files (PascalCase callables, camelCase locals).
4. Host materializes typed output under the mod's `generatedOutput` root.
5. Consumer imports generated parsers from the declared `module` path.
``````

</details>

### Source Record: Verification

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/compiler-mods/pest-parser-generator/articles/verification-and-traceability/`  
**Source:** `site/spec-content/platform-spec/compiler/compiler-mods/pest-parser-generator/articles/verification-and-traceability/content.md`  
**SHA-256:** `90287b7e8827daf226447c8eb34e2c4ead2884075a495bf4965d63e03bbbcbd0`

<details>
<summary>Migrated source text</summary>

``````markdown
## Anchors

- `compiler/crates/beskid_tests/fixtures/mods/pest_gen_mod/`
- `compiler/crates/beskid_pest_gen/tests/`
``````

</details>
