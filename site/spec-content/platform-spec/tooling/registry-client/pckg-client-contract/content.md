---
title: pckg client contract
description: Contract surface for the Beskid package registry client crate used
  by tooling workflows.
specLevel: feature
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-04-30
---

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

## Decisions
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-TOOL-PCKG-0001` … `D-TOOL-PCKG-0005`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Contracts and edge cases](./articles/contracts-and-edge-cases/)
- [Design model](./articles/design-model/)
- [Examples](./articles/examples/)
- [FAQ and troubleshooting](./articles/faq-and-troubleshooting/)
- [Flow and algorithm](./articles/flow-and-algorithm/)
- [Verification and traceability](./articles/verification-and-traceability/)
<!-- /spec:generate:article-index -->
