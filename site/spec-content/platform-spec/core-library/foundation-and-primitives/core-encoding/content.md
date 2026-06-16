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
