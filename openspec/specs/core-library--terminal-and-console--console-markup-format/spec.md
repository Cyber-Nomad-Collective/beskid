<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# Console markup format Specification

## Purpose

Beskid console markup parsing and rendering to ANSI-styled strings.

## Requirements

### Requirement: Markup is not full CommonMark: Decision [D-CORE-TERM-0030]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> | Rule | Detail |
> | --- | --- |
> | Scope | Tested sigils and markdown subset only |
> | Non-goal | Full CommonMark compliance |

**Stable ID:** `BSP-REQ-F7B00A0C2B36`  
**Legacy source:** `site/spec-content/platform-spec/core-library/terminal-and-console/console-markup-format/adr/0030-markup-not-full-commonmark/content.md`  
**Source SHA-256:** `79a9bebe0743daf0de24ef5cd6fed0f1abd8e7e33ff20cfb11ca78fc0eaed1e6`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Bracket palette tags in v1: Decision [D-CORE-TERM-0031]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> | Rule | Detail |
> | --- | --- |
> | Tags | `[red]`-style names map to fixed palette |
> | RGB | Not supported inside markup v1 |

**Stable ID:** `BSP-REQ-90FDEA2BA266`  
**Legacy source:** `site/spec-content/platform-spec/core-library/terminal-and-console/console-markup-format/adr/0031-bracket-palette-tags-v1/content.md`  
**Source SHA-256:** `d9b60e6e1274caa38a5d627f1aae2d01a698e2f515f0c08a63610dd741ab13ba`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Canonical console markup syntax v1: Decision [D-CORE-TEXT-0001]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> | Construct | v1 canonical | Notes |
> | --- | --- | --- |
> | Palette foreground | `[red]text[/]` | Named palette from `Attributes`; **FMT-002** on unknown names |
> | Rich attributes | `&[fg=red, bg=blue](text)` | Supports named, `#hex`, `rgb(r,g,b)` — supersedes ADR-0031 RGB ban |
> | Hyperlink | `[label](url)` | OSC hyperlink when styled; **FMT-006** |
> | Precedence | escape > bold/italic/underline/strike > attribute span > bracket tag > link > literal | Encoded in `console_markup.pest` |
> 
> Bracket palette tags and attribute spans **may** both appear in the same document. Attribute spans are preferred for multi-attribute styling.

**Stable ID:** `BSP-REQ-FB8F24ECB556`  
**Legacy source:** `site/spec-content/platform-spec/core-library/terminal-and-console/console-markup-format/adr/0032-canonical-markup-syntax-v1/content.md`  
**Source SHA-256:** `d447d2f2030d5ee4f0a566d7c8a9d667a5481049cef9fc41a2898406af05fa7e`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

## Informative Source Provenance

The records below preserve migration history and are not normative except where text was extracted into a requirement above.

### Source Record: Console markup format

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/core-library/terminal-and-console/console-markup-format/`  
**Source:** `site/spec-content/platform-spec/core-library/terminal-and-console/console-markup-format/content.md`  
**SHA-256:** `cb7e26a29ee3208514c0039229f86012fcded1ed00cdb4ede4e0796f60b0de60`

<details>
<summary>Migrated source text</summary>

``````markdown
<SpecSection title="What this feature specifies" id="what-this-feature-specifies">
`Console.Format` turns **console markup** (lightweight sigils and markdown subset) into UTF-8 strings containing optional ANSI sequences. Parsing lives in `Console.Format.Scan` and `Console.Format.Markdown`; attributes map through `Console.Format.Attributes` and `Ansi.StyleChain`.
</SpecSection>

<SpecSection title="Contract statement" id="contract-statement">
- `Format(text)` **must** use styled rendering when `Console.ShouldStyle()` is true (alias of `ShouldEmitAnsi()`).
- `RenderPlain` **must** never emit escapes.
- Supported sigils in v1 include bracket color tags (`[red]`), `**bold**`, `__underline__`, and related scan rules covered by tests.
- Rendered output **must** pass through capability gating before syscall write (via `Ansi.Escape.WhenEnabled` / `EmitCsi`).
</SpecSection>

<SpecSection title="Implementation anchors" id="implementation-anchors">
- `compiler/corelib/packages/console/src/Console/Format.bd`
- `compiler/corelib/packages/console/src/Console/Format/Markdown.bd`, `Attributes.bd`, `Scan.bd`
- Tests: `FormatMarkdownTests.bd`, `FormatAttributesTests.bd`
</SpecSection>

## Decisions
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-CORE-TERM-0030` … `D-CORE-TEXT-0001`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Contracts and edge cases](./articles/contracts-and-edge-cases/)
- [Design model](./articles/design-model/)
- [Examples](./articles/examples/)
- [Flow and algorithm](./articles/flow-and-algorithm/)
- [Verification and traceability](./articles/verification-and-traceability/)
<!-- /spec:generate:article-index -->
``````

</details>

### Source Record: Markup is not full CommonMark

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/core-library/terminal-and-console/console-markup-format/adr/0030-markup-not-full-commonmark/`  
**Source:** `site/spec-content/platform-spec/core-library/terminal-and-console/console-markup-format/adr/0030-markup-not-full-commonmark/content.md`  
**SHA-256:** `79a9bebe0743daf0de24ef5cd6fed0f1abd8e7e33ff20cfb11ca78fc0eaed1e6`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Console.Format targets terminal styling, not a document renderer.

## Decision

| Rule | Detail |
| --- | --- |
| Scope | Tested sigils and markdown subset only |
| Non-goal | Full CommonMark compliance |

## Consequences

New syntax requires tests before Standard promotion.

## Verification anchors

`FormatMarkdownTests.bd`; `Format/Scan.bd`.
``````

</details>

### Source Record: Bracket palette tags in v1

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/core-library/terminal-and-console/console-markup-format/adr/0031-bracket-palette-tags-v1/`  
**Source:** `site/spec-content/platform-spec/core-library/terminal-and-console/console-markup-format/adr/0031-bracket-palette-tags-v1/content.md`  
**SHA-256:** `d9b60e6e1274caa38a5d627f1aae2d01a698e2f515f0c08a63610dd741ab13ba`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Arbitrary RGB in markup v1 would bypass capability downgrade rules.

## Decision

| Rule | Detail |
| --- | --- |
| Tags | `[red]`-style names map to fixed palette |
| RGB | Not supported inside markup v1 |

## Consequences

Authors use Ansi builders for advanced color outside markup.

## Verification anchors

`FormatAttributesTests.bd`.
``````

</details>

### Source Record: Canonical console markup syntax v1

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/core-library/terminal-and-console/console-markup-format/adr/0032-canonical-markup-syntax-v1/`  
**Source:** `site/spec-content/platform-spec/core-library/terminal-and-console/console-markup-format/adr/0032-canonical-markup-syntax-v1/content.md`  
**SHA-256:** `d447d2f2030d5ee4f0a566d7c8a9d667a5481049cef9fc41a2898406af05fa7e`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Spec, ADR-0031, and implementation disagree on color syntax (`[red]text[/]` vs `&[fg=red](text)`). Hyperlinks exist in code but not in contracts.

## Decision

| Construct | v1 canonical | Notes |
| --- | --- | --- |
| Palette foreground | `[red]text[/]` | Named palette from `Attributes`; **FMT-002** on unknown names |
| Rich attributes | `&[fg=red, bg=blue](text)` | Supports named, `#hex`, `rgb(r,g,b)` — supersedes ADR-0031 RGB ban |
| Hyperlink | `[label](url)` | OSC hyperlink when styled; **FMT-006** |
| Precedence | escape > bold/italic/underline/strike > attribute span > bracket tag > link > literal | Encoded in `console_markup.pest` |

Bracket palette tags and attribute spans **may** both appear in the same document. Attribute spans are preferred for multi-attribute styling.

## Consequences

- `console_markup.pest` is the single grammar authority.
- `FormatMarkdownTests.bd` gains bracket-tag cases; ADR-0031 palette-only RGB rule is relaxed for `&[fg=](…)` form.
- Hand-rolled `RenderInner` is retired after generated parser lands.

## Verification anchors

- `compiler/corelib/packages/console/grammars/console_markup.pest`
- `compiler/corelib/beskid_corelib/tests/corelib_tests/src/console/FormatMarkdownTests.bd`
``````

</details>

### Source Record: Contracts and edge cases

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/core-library/terminal-and-console/console-markup-format/articles/contracts-and-edge-cases/`  
**Source:** `site/spec-content/platform-spec/core-library/terminal-and-console/console-markup-format/articles/contracts-and-edge-cases/content.md`  
**SHA-256:** `ac822e3ddc9d37badff3a72cf3ea457a8e6ebec1df8049fa7975d9c51a0cdf49`

<details>
<summary>Migrated source text</summary>

``````markdown
## Purpose

Document **contracts and edge cases** for the **Console Markup Format** feature: role-specific normative detail beyond the feature hub.

## Canonical references

- Feature hub: [Console Markup Format](/platform-spec/core-library/terminal-and-console/console-markup-format/)
- Sibling articles in this bundle (design model, contracts, flow, examples, verification)

## Detailed behavior

### Normative requirements

| ID | Requirement |
| --- | --- |
| **FMT-001** | Unclosed `**` or `__` spans **must** fall through as literal text (no panic). |
| **FMT-002** | Unknown bracket tag names **must** render as literal `[name]` text. |
| **FMT-003** | Backslash before a recognized sigil **must** emit the sigil literally and continue parsing. |
| **FMT-004** | `Format` **must** delegate to styled render only when `ShouldStyle()` is true. |
| **FMT-005** | Each styled span **should** reset attributes after the span (`StyleChain` / SGR reset). |
| **FMT-006** | `[label](url)` **must** emit OSC hyperlink when styled; literal when plain. |

### Supported constructs (v1)

Per [ADR D-CORE-TEXT-0001](./adr/0032-canonical-markup-syntax-v1/):

| Construct | Effect when styled |
| --- | --- |
| `**text**` | Bold |
| `*text*` | Italic |
| `__text__` | Underline |
| `~~text~~` | Strikethrough |
| `[red]text[/]` | Foreground palette (name table in `Attributes.bd`) |
| `&[fg=red](text)` | Attribute span (named, `#hex`, `rgb()`) |
| `[label](url)` | OSC hyperlink |
| `\[` etc. | Escape sigil |

### Edge cases

- Nested styles apply inner chain then outer tail recursively.
- Empty source returns `""`.
- Markup does not interpret HTML or full Markdown block syntax (headings, lists).

## Verification

See the verification and traceability article in this bundle and `compiler/corelib/beskid_corelib/tests/corelib_tests/src/console/`.

## Related topics

- Parent [feature hub](/platform-spec/core-library/terminal-and-console/console-markup-format/) and [Terminal and console area](/platform-spec/core-library/terminal-and-console/)
``````

</details>

### Source Record: Design model

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/core-library/terminal-and-console/console-markup-format/articles/design-model/`  
**Source:** `site/spec-content/platform-spec/core-library/terminal-and-console/console-markup-format/articles/design-model/content.md`  
**SHA-256:** `bd3e0dfa4859a060f079d3e7b9a6c8386ed2ca20a9d090dab5eb051b8e776dcd`

<details>
<summary>Migrated source text</summary>

``````markdown
## Purpose

Document **design model** for the **Console Markup Format** feature: role-specific normative detail beyond the feature hub.

## Canonical references

- Feature hub: [Console Markup Format](/platform-spec/core-library/terminal-and-console/console-markup-format/)
- Sibling articles in this bundle (design model, contracts, flow, examples, verification)

## Detailed behavior

### Pipeline

1. **Cursor** — [Core.Text.Cursor](/platform-spec/core-library/text-and-parsing/text-cursor/) provides byte-indexed string cursor operations.
2. **Parse** — Generated parser from `console_markup.pest` (via [Pest parser generator](/platform-spec/compiler/compiler-mods/pest-parser-generator/)) built on [Core.Text.Parser](/platform-spec/core-library/text-and-parsing/text-parser-combinators/) combinators. Canonical syntax per [ADR D-CORE-TEXT-0001](./adr/0032-canonical-markup-syntax-v1/).
3. **Style** — `Attributes` / `StyleChain` map names (`red`, `bold`) to `Ansi.Sgr` or chain steps.
4. **Emit** — Concatenated gated escape prefixes wrap plain text segments.

### Plain vs styled

| Entry | `ansi` flag | Use |
| --- | --- | --- |
| `RenderPlain` | false | Logs and non-TTY snapshots |
| `RenderStyled` / `Format` | true | Interactive terminal UI |

### Escape authority

Sequence bytes are defined in [ANSI escape model](/platform-spec/core-library/terminal-and-console/ansi-escape-model/); markup **must not** embed raw ESC except via the Ansi builders.

## Verification

See the verification and traceability article in this bundle and `compiler/corelib/beskid_corelib/tests/corelib_tests/src/console/`.

## Related topics

- Parent [feature hub](/platform-spec/core-library/terminal-and-console/console-markup-format/) and [Terminal and console area](/platform-spec/core-library/terminal-and-console/)
``````

</details>

### Source Record: Examples

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/core-library/terminal-and-console/console-markup-format/articles/examples/`  
**Source:** `site/spec-content/platform-spec/core-library/terminal-and-console/console-markup-format/articles/examples/content.md`  
**SHA-256:** `3b841660c5806fe5ef5cd020d8dc60db9984173dd53e95e9bca00fa1e71cf011`

<details>
<summary>Migrated source text</summary>

``````markdown
## Purpose

Show how application code turns **console markup** into syscall-backed stdout/stderr lines using `Console.Format` and the split stream modules.

## Canonical references

- Feature hub: [Console markup format](/platform-spec/core-library/terminal-and-console/console-markup-format/)
- Parsing rules: [contracts and edge cases](./contracts-and-edge-cases/) (**FMT-001**–**FMT-005**)
- Escape tables: [ANSI escape model / design model](/platform-spec/core-library/terminal-and-console/ansi-escape-model/design-model/)
- Write surface: [Console I/O streams / examples](/platform-spec/core-library/terminal-and-console/console-io-streams/examples/)

## Detailed behavior

### One-line styled output

```beskid
Console.FormatLine("[green]ok[/] **built** in 12ms");
```

`FormatLine` renders with `ShouldStyle()` (same predicate as `ShouldEmitAnsi()`), then calls `Core.Output.WriteLine`. When color is stripped, output is plain text without bracket tags interpreted as color.

### Plain vs styled render entry points

```beskid
string plain = Console.Format.Markdown.RenderPlain("[red]ignored[/]");
string styled = Console.Format.Markdown.RenderStyled("[red]alert[/]");
```

Use `RenderPlain` for logs and redirected stdout; use `RenderStyled` or `Format` when building strings that will be gated before write.

### Nested styles

```beskid
string line = Console.Format.Markdown.RenderStyled(
    "[blue]**Error:**[/] file not found"
);
Core.Output.WriteLine(line);
```

Inner `**` spans compose with outer bracket color via `Ansi.StyleChain` (see [flow and algorithm](./flow-and-algorithm/)).

## Verification

Golden coverage: `FormatMarkdownTests.bd`, `FormatAttributesTests.bd`, `AnsiStyleChainTests.bd` under `compiler/corelib/beskid_corelib/tests/corelib_tests/src/console/`.

## Related topics

- [Console capabilities](/platform-spec/core-library/terminal-and-console/console-capabilities/) — when `ShouldStyle()` is false
- [Console controls](/platform-spec/core-library/terminal-and-console/console-controls/) — full-screen widgets that may call `Format` for labels
``````

</details>

### Source Record: Flow and algorithm

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/core-library/terminal-and-console/console-markup-format/articles/flow-and-algorithm/`  
**Source:** `site/spec-content/platform-spec/core-library/terminal-and-console/console-markup-format/articles/flow-and-algorithm/content.md`  
**SHA-256:** `0c8665c0f805c8c7bf61ffd8e9fbef3efe4b06dcb90f075ed8e22dfb89238449`

<details>
<summary>Migrated source text</summary>

``````markdown
## Purpose

Document **flow and algorithm** for the **Console Markup Format** feature: role-specific normative detail beyond the feature hub.

## Canonical references

- Feature hub: [Console Markup Format](/platform-spec/core-library/terminal-and-console/console-markup-format/)
- Sibling articles in this bundle (design model, contracts, flow, examples, verification)

## Detailed behavior

### `RenderInner(source, ansi)` algorithm

1. If length zero → return `""`.
2. If starts with `\` and next char is escapable sigil → emit sigil + recurse on remainder.
3. If starts with `**` and closing `**` exists → render inner with bold chain when `ansi`, recurse tail.
4. If starts with `__` and closing exists → underline branch (same structure).
5. If starts with `[` → parse tag name, apply attribute chain for body until `[/]`, recurse tail.
6. Else consume one code unit and recurse (literal accumulation).

### `Console.FormatLine` integration

`Format(text)` → `Core.Output.WriteLine(styled)` per [Console I/O streams](/platform-spec/core-library/terminal-and-console/console-io-streams/flow-and-algorithm/).

## Verification

See the verification and traceability article in this bundle and `compiler/corelib/beskid_corelib/tests/corelib_tests/src/console/`.

## Related topics

- Parent [feature hub](/platform-spec/core-library/terminal-and-console/console-markup-format/) and [Terminal and console area](/platform-spec/core-library/terminal-and-console/)
``````

</details>

### Source Record: Verification and traceability

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/core-library/terminal-and-console/console-markup-format/articles/verification-and-traceability/`  
**Source:** `site/spec-content/platform-spec/core-library/terminal-and-console/console-markup-format/articles/verification-and-traceability/content.md`  
**SHA-256:** `a1819d4f5a06cb176decf3c9d175e5ffb4f242ea0ac1a1844ce380d844054f78`

<details>
<summary>Migrated source text</summary>

``````markdown
## Purpose

Document **verification and traceability** for the **Console Markup Format** feature: role-specific normative detail beyond the feature hub.

## Canonical references

- Feature hub: [Console Markup Format](/platform-spec/core-library/terminal-and-console/console-markup-format/)
- Sibling articles in this bundle (design model, contracts, flow, examples, verification)

## Detailed behavior

| Test | Coverage |
| --- | --- |
| `FormatMarkdownTests.bd` | Bold, underline, bracket colors, escapes |
| `FormatAttributesTests.bd` | Name → SGR mapping |
| `AnsiStyleChainTests.bd` | Chain composition |

Source: `compiler/corelib/packages/console/src/Console/Format*.bd`. New sigils require **FMT-*** contract row + golden test in the same change.

## Verification

See the verification and traceability article in this bundle and `compiler/corelib/beskid_corelib/tests/corelib_tests/src/console/`.

## Related topics

- Parent [feature hub](/platform-spec/core-library/terminal-and-console/console-markup-format/) and [Terminal and console area](/platform-spec/core-library/terminal-and-console/)
``````

</details>
