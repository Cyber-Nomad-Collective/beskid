import SpecPageHeader from '@beskid/beskid-ui/platform-spec/SpecPageHeader.astro';
import DomainTiles from '@beskid/beskid-ui/platform-spec/DomainTiles.astro';
import SpecSection from '@beskid/beskid-ui/platform-spec/SpecSection.astro';

<SpecPageHeader status="Standard" ownerName="Piotr Mikstacki" ownerEmail="pmikstacki@cybernomad.it" submitterName="Piotr Mikstacki" submitterEmail="pmikstacki@cybernomad.it" />

<SpecSection title="What this feature specifies" id="what-this-feature-specifies">
`Runtime feature flags` defines one operational contract that a newcomer can follow end-to-end: first the model, then execution flow, then strict guarantees, concrete examples, and verification guidance.
</SpecSection>

<SpecSection title="Implementation anchors" id="implementation-anchors">
- Runtime compile-time flags and exports in `compiler/crates/beskid_runtime/src/lib.rs`
- Runtime builtins feature gating in `compiler/crates/beskid_runtime/src/builtins/mod.rs`
- Execution setup in `compiler/crates/beskid_cli/src/commands/doc.rs`
- Runtime tests in `compiler/crates/beskid_tests/src/runtime/jit.rs`
</SpecSection>

## Decisions

No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-EXEC-RT-0014`, `D-EXEC-RT-0015`); use the reader **ADRs** tab for expandable detail.
