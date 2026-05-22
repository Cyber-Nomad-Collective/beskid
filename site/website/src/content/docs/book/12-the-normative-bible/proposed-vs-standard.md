---
title: "Proposed vs Standard"
description: Maturity labels—what you can cite in arguments and what is still forming.
tableOfContents: true
---

Spec pages carry **`status`** metadata. Treat it like a fire rating on a door—not decoration.

| `status` | Meaning |
| --- | --- |
| **Proposed** | Incomplete or unstable; do not cite as enforceable language law |
| **Standard** | Enforceable contract at this Git revision; needs decisions + verification anchors |

From [Specification authority](/platform-spec/community/spec-maintenance/spec-authority-and-decisions/).

## Standard gates

A **Standard** feature hub **must** have:

- Normative MUST/SHOULD/MAY prose
- Verification anchors (tests, crates, registry links)
- **`## Decisions`** on the hub and/or **`adr/`** per decision

Placeholder-only bundles or circular canon stubs **must** downgrade to **Proposed** until fixed ([Feature hub template](/platform-spec/community/spec-maintenance/feature-hub-article-bundle-template/)).

## v0.x bands

Roadmap labels like **v0.2** describe **delivery scope**, not alternate spec URLs—see [Release and versioning policy](/platform-spec/community/spec-maintenance/release-and-versioning-policy/).

## For readers

When building on Beskid for production, prefer **Standard** language-meta articles. When experimenting, read **Proposed** pages—but do not blame the compiler when the spec said "still forming."

## Next

[Git as version axis](/book/12-the-normative-bible/git-as-version-axis/)
