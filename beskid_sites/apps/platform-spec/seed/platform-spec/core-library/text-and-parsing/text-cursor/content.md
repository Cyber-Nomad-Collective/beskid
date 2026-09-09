import SpecPageHeader from '@beskid/beskid-ui/platform-spec/SpecPageHeader.astro';
import DomainTiles from '@beskid/beskid-ui/platform-spec/DomainTiles.astro';
import SpecSection from '@beskid/beskid-ui/platform-spec/SpecSection.astro';

<SpecPageHeader status="Standard" ownerName="Piotr Mikstacki" ownerEmail="pmikstacki@cybernomad.it" submitterName="Piotr Mikstacki" submitterEmail="pmikstacki@cybernomad.it" />

<SpecSection title="What this feature specifies" id="what-this-feature-specifies">
`Core.Text.Cursor` provides allocation-light string cursor operations for parser combinators.
</SpecSection>

<SpecSection title="Implementation anchors" id="implementation-anchors">
- `compiler/corelib/packages/foundation/src/Core/Text/Cursor.bd`
</SpecSection>
