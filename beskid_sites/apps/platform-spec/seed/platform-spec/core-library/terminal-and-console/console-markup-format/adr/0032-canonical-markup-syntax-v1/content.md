import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

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
