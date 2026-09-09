import SpecPageHeader from '@beskid/beskid-ui/platform-spec/SpecPageHeader.astro';
import DomainTiles from '@beskid/beskid-ui/platform-spec/DomainTiles.astro';
import SpecSection from '@beskid/beskid-ui/platform-spec/SpecSection.astro';

<SpecPageHeader status="Standard" ownerName="Piotr Mikstacki" ownerEmail="pmikstacki@cybernomad.it" submitterName="Piotr Mikstacki" submitterEmail="pmikstacki@cybernomad.it" />

<SpecSection title="What this feature specifies" id="what-this-feature-specifies">
`Panic, IO, and syscalls` defines one operational contract that a newcomer can follow end-to-end: first the model, then execution flow, then strict guarantees, concrete examples, and verification guidance.
</SpecSection>

<SpecSection title="Implementation anchors" id="implementation-anchors">
- Builtin exports in `compiler/crates/beskid_runtime/src/builtins/mod.rs`
- Panic and syscall implementation in `compiler/crates/beskid_runtime/src/builtins/panic_io.rs`
- Runtime symbol registration in `compiler/crates/beskid_runtime/src/lib.rs`
- E2E coverage in `compiler/crates/beskid_e2e_tests/src/tests/runtime_cases.rs`
</SpecSection>

## Decisions

No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-EXEC-RT-0008` … `D-EXEC-RT-0010`); use the reader **ADRs** tab for expandable detail.
