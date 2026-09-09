import SpecPageHeader from '@beskid/beskid-ui/platform-spec/SpecPageHeader.astro';

<SpecPageHeader status="Standard" ownerName="Piotr Mikstacki" ownerEmail="pmikstacki@cybernomad.it" submitterName="Piotr Mikstacki" submitterEmail="pmikstacki@cybernomad.it" />

This feature hub specifies how manifests become prepared dependency workspaces and how `Project.lock` is synchronized under `--locked` and `--frozen`.

## Implementation anchors
- `compiler/crates/beskid_analysis/src/projects/` — workspace materialization and dependency graph
- `compiler/crates/beskid_pipeline/src/phases.rs` — pipeline stage ordering gates
- `compiler/crates/beskid_cli/src/commands/` — lock policy flags (`--locked`, `--frozen`)

## Decisions

No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMP-BUILD-0007` … `D-COMP-BUILD-0009`); use the reader **ADRs** tab for expandable detail.


- [Design model](./design-model/)
- [Flow and algorithm](./flow-and-algorithm/)
- [Contracts and edge cases](./contracts-and-edge-cases/)
- [Examples](./examples/)
- [Verification and traceability](./verification-and-traceability/)
- [FAQ and troubleshooting](./faq-and-troubleshooting/)
