import SpecPageHeader from '@beskid/beskid-ui/platform-spec/SpecPageHeader.astro';
import DomainTiles from '@beskid/beskid-ui/platform-spec/DomainTiles.astro';
import SpecSection from '@beskid/beskid-ui/platform-spec/SpecSection.astro';

<SpecPageHeader status="Standard" ownerName="Piotr Mikstacki" ownerEmail="pmikstacki@cybernomad.it" submitterName="Piotr Mikstacki" submitterEmail="pmikstacki@cybernomad.it" />

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

No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-CORE-TERM-0030`, `D-CORE-TERM-0031`); use the reader **ADRs** tab for expandable detail.
