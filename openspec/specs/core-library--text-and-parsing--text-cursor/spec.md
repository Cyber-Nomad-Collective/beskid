<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# Core.Text.Cursor Specification

## Purpose

Allocation-light string cursor operations for parser combinators.

## Requirements

### Requirement: Cursor state shape
`Core.Text.Cursor` MUST track `{ source: string, pos: i64 }` (**CURSOR-001**).

#### Scenario: Cursor exposes source and position
- **GIVEN** a `Cursor` constructed from a source string
- **WHEN** a caller inspects cursor state
- **THEN** the cursor holds that source and a byte offset `pos` of type `i64`

### Requirement: Bounds-safe Slice, Drop, Peek, and Advance
`Slice`, `Drop`, `Peek`, and `Advance` MUST be bounds-safe (**CURSOR-002**).

#### Scenario: Advance at end of source
- **GIVEN** a `Cursor` whose `pos` is at the end of `source`
- **WHEN** a caller invokes `Peek` or `Advance`
- **THEN** the operation remains bounds-safe and does not read past the source

### Requirement: Position returns current byte offset
`Position` MUST return the current byte offset (**CURSOR-003**).

#### Scenario: Position matches pos
- **GIVEN** a `Cursor` with `pos` set to a known byte offset
- **WHEN** a caller invokes `Position`
- **THEN** the returned value equals that byte offset

### Requirement: Allocation-light hot paths
Hot paths MUST NOT allocate except for `Slice` / `Drop` views (**CURSOR-004**).

#### Scenario: Peek and Advance do not allocate
- **GIVEN** an existing `Cursor` over a source string
- **WHEN** a caller invokes `Peek` or `Advance` on a hot path
- **THEN** the call does not allocate; only `Slice` or `Drop` may allocate view materialization

## Informative Source Provenance

The records below preserve migration history and are not normative except where text was extracted into a requirement above.

### Source Record: Core.Text.Cursor

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/core-library/text-and-parsing/text-cursor/`  
**Source:** `site/spec-content/platform-spec/core-library/text-and-parsing/text-cursor/content.md`  
**SHA-256:** `f5f8ef7e38616f84ec1b67492b3f36e12e35fbd2e815c2ae75b84e3c22531ab7`

<details>
<summary>Migrated source text</summary>

``````markdown
<SpecSection title="What this feature specifies" id="what-this-feature-specifies">
`Core.Text.Cursor` provides allocation-light string cursor operations for parser combinators.
</SpecSection>

<SpecSection title="Implementation anchors" id="implementation-anchors">
- `compiler/corelib/packages/foundation/src/Core/Text/Cursor.bd`
</SpecSection>

## Decisions
<!-- spec:generate:adr-index -->
No ADRs published under **`adr/`** yet.
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

### Source Record: Contracts and edge cases

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/core-library/text-and-parsing/text-cursor/articles/contracts-and-edge-cases/`  
**Source:** `site/spec-content/platform-spec/core-library/text-and-parsing/text-cursor/articles/contracts-and-edge-cases/content.md`  
**SHA-256:** `dca5728bef5c9fab6591e85ccdb1f34a03035a4a12befc403a66ce265fd0dfbe`

<details>
<summary>Migrated source text</summary>

``````markdown
## Normative requirements

| ID | Requirement |
| --- | --- |
| **CURSOR-001** | `Cursor` **must** track `{ source: string, pos: i64 }`. |
| **CURSOR-002** | `Slice`, `Drop`, `Peek`, `Advance` **must** be bounds-safe. |
| **CURSOR-003** | `Position` **must** return current byte offset. |
| **CURSOR-004** | Hot paths **must not** allocate except `Slice`/`Drop` views. |
``````

</details>

### Source Record: Design model

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/core-library/text-and-parsing/text-cursor/articles/design-model/`  
**Source:** `site/spec-content/platform-spec/core-library/text-and-parsing/text-cursor/articles/design-model/content.md`  
**SHA-256:** `b09e7a4ab25ec4b971fd08d43d3f7fd4609ed7b062b0adafcd3364caa7c13858`

<details>
<summary>Migrated source text</summary>

``````markdown
## Module layout

| Symbol | Role |
| --- | --- |
| `Core.Text.Cursor` | Public API hub |
``````

</details>

### Source Record: Examples

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/core-library/text-and-parsing/text-cursor/articles/examples/`  
**Source:** `site/spec-content/platform-spec/core-library/text-and-parsing/text-cursor/articles/examples/content.md`  
**SHA-256:** `520d0042dd5064b2677743de922f2313164701502940ecffc34c3f3a8c77a73e`

<details>
<summary>Migrated source text</summary>

``````markdown
## Examples

See implementation anchors: `compiler/corelib/packages/foundation/src/Core/Text/Cursor.bd`
``````

</details>

### Source Record: FAQ

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/core-library/text-and-parsing/text-cursor/articles/faq-and-troubleshooting/`  
**Source:** `site/spec-content/platform-spec/core-library/text-and-parsing/text-cursor/articles/faq-and-troubleshooting/content.md`  
**SHA-256:** `27e4fdf9e9f7170b27e469739c81496e6184f63b988a5e10a6e1f7d85fea1850`

<details>
<summary>Migrated source text</summary>

``````markdown
## FAQ

### Why combinator-first?

One substrate for markup, regex, and future DSL parsers.
``````

</details>

### Source Record: Flow and algorithm

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/core-library/text-and-parsing/text-cursor/articles/flow-and-algorithm/`  
**Source:** `site/spec-content/platform-spec/core-library/text-and-parsing/text-cursor/articles/flow-and-algorithm/content.md`  
**SHA-256:** `06af6198e9c3c89afa11f2845f06ce83b00e8d468a66fc59d8cb113722e49a29`

<details>
<summary>Migrated source text</summary>

``````markdown
## Algorithm

1. Construct `Cursor` from source.
2. Run combinator or generated parser.
3. Return `ParseResult`.
``````

</details>

### Source Record: Verification

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/core-library/text-and-parsing/text-cursor/articles/verification-and-traceability/`  
**Source:** `site/spec-content/platform-spec/core-library/text-and-parsing/text-cursor/articles/verification-and-traceability/content.md`  
**SHA-256:** `155dce69d508f80298a58d233b11593bc0d7ed592ecbc44184d37e9a0d39d82f`

<details>
<summary>Migrated source text</summary>

``````markdown
## Conformance

- `compiler/corelib/beskid_corelib/tests/corelib_tests/src/text/`
- Contract IDs: **CURSOR-***
``````

</details>
