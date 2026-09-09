import SpecPageHeader from '@beskid/beskid-ui/platform-spec/SpecPageHeader.astro';
import DomainTiles from '@beskid/beskid-ui/platform-spec/DomainTiles.astro';
import SpecSection from '@beskid/beskid-ui/platform-spec/SpecSection.astro';

<SpecPageHeader status="Standard" ownerName="Piotr Mikstacki" ownerEmail="pmikstacki@cybernomad.it" submitterName="Piotr Mikstacki" submitterEmail="pmikstacki@cybernomad.it" />

<SpecSection title="What this feature specifies" id="what-this-feature-specifies">
`pckg client contract` defines one operational contract that a newcomer can follow end-to-end: first the model, then execution flow, then strict guarantees, concrete examples, and verification guidance.
</SpecSection>

<SpecSection title="Implementation anchors" id="implementation-anchors">
- Public client API in `compiler/crates/beskid_pckg/src/lib.rs`
- HTTP and auth flows in `compiler/crates/beskid_pckg/src/client.rs`
- CLI integration in `compiler/crates/beskid_pckg/src/cli.rs`
- Package dashboard behavior in `pckg/src/Server/Components/Pages/Dashboard/Packages.razor.cs`
</SpecSection>

<SpecSection title="Decisions" id="decisions">
No open decisions. **`D-TOOL-PCKG-0001`** (hub authority), **`0002`** (registry-assigned versions), **`0005`** (`api.json` **`symbolKey`** validation)—see **`adr/`** and the **ADRs** tab.
</SpecSection>
