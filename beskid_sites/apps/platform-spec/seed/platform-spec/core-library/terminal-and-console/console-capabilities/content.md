import SpecPageHeader from '@beskid/beskid-ui/platform-spec/SpecPageHeader.astro';
import DomainTiles from '@beskid/beskid-ui/platform-spec/DomainTiles.astro';
import SpecSection from '@beskid/beskid-ui/platform-spec/SpecSection.astro';

<SpecPageHeader status="Standard" ownerName="Piotr Mikstacki" ownerEmail="pmikstacki@cybernomad.it" submitterName="Piotr Mikstacki" submitterEmail="pmikstacki@cybernomad.it" />

<SpecSection title="What this feature specifies" id="what-this-feature-specifies">
`Console.Capabilities` and `Platform.Terminal` probe whether styled output is appropriate: TTY detection on fd **1**, environment flags (`NO_COLOR`, `FORCE_COLOR`, `COLORTERM`, `TERM`), and the **effective color model** used by `Ansi.Sgr` downgrade logic.
</SpecSection>

<SpecSection title="Contract statement" id="contract-statement">
- `ShouldEmitAnsi()` **must** return **false** when `NO_COLOR` is set (non-empty value per `EnvFlagSet`).
- When not forced, non-TTY stdout **must** suppress ANSI emission.
- `FORCE_COLOR` **must** enable emission even when stdout is not a TTY.
- `EffectiveColorModel` **must** return `Basic16` when color is stripped, otherwise the probed model (`Basic8`, `Basic16`, `Indexed256`, `TrueColor`).
- `Platform.Terminal.ForcePlainText()` **should** align with dumb terminals (`TERM=dumb`) and piped stdout unless `FORCE_COLOR` is set.
</SpecSection>

<SpecSection title="Implementation anchors" id="implementation-anchors">
- `compiler/corelib/packages/console/src/Console/Capabilities.bd`
- `compiler/corelib/packages/console/src/Platform/Terminal.bd`
- Tests: `CapabilitiesTests.bd`
</SpecSection>

## Decisions

No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-CORE-TERM-0020` … `D-CORE-TERM-0022`); use the reader **ADRs** tab for expandable detail.
