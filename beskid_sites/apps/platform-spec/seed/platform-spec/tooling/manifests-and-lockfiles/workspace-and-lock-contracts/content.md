import SpecPageHeader from '@beskid/beskid-ui/platform-spec/SpecPageHeader.astro';
import DomainTiles from '@beskid/beskid-ui/platform-spec/DomainTiles.astro';
import SpecSection from '@beskid/beskid-ui/platform-spec/SpecSection.astro';

<SpecPageHeader status="Standard" ownerName="Piotr Mikstacki" ownerEmail="pmikstacki@cybernomad.it" submitterName="Piotr Mikstacki" submitterEmail="pmikstacki@cybernomad.it" />

<SpecSection title="What this feature specifies" id="what-this-feature-specifies">
`Workspace and lock contracts` defines one operational contract that a newcomer can follow end-to-end: first the model, then execution flow, then strict guarantees, concrete examples, and verification guidance.
</SpecSection>

<SpecSection title="Implementation anchors" id="implementation-anchors">
- Lock/update commands in `compiler/crates/beskid_cli/src/commands/`
- Project and dependency resolution in `compiler/crates/beskid_analysis/src/resolve/mod.rs`
- Workspace tests in `compiler/crates/beskid_tests/src/analysis/pipeline/core.rs`
- Corelib package tests in `compiler/crates/beskid_tests/src/projects/corelib/layout.rs`
</SpecSection>

<SpecSection title="Decisions" id="decisions">
No open decisions. **`D-TOOL-MAN-0001`** (hub authority), **`0002`** (lock mutations via CLI)—see **`adr/`** and the **ADRs** tab.
</SpecSection>
