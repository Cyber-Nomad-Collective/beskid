---
title: Core.Encoding
description: Encoding contracts and Utf8, Hex, Base64 implementations.
specLevel: feature
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-06-06
---

<SpecSection title="What this feature specifies" id="what-this-feature-specifies">
`Core.Encoding` defines a shared encoder contract and concrete encodings: **Utf8** (language default), **Hex**, and **Base64**. Invalid input returns `Result` errors; no silent replacement in v1.
</SpecSection>

## Decisions
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-CORE-PRIM-0020`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Contracts and edge cases](./articles/contracts-and-edge-cases/)
- [Design model](./articles/design-model/)
- [Verification and traceability](./articles/verification-and-traceability/)
<!-- /spec:generate:article-index -->
