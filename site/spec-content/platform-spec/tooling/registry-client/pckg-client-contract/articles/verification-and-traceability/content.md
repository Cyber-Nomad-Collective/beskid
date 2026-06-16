---
title: Verification and traceability
description: Tests and traceability for the pckg client contract.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
---

## Client / compiler

| Area | Location |
| --- | --- |
| Pack profile detection | `beskid_pckg/src/pack.rs` unit tests |
| CLI wiring | `beskid_pckg/src/cli.rs` |
| Workspace fetch integration | `beskid_tests` pipeline + fetch scenarios |

## pckg server

| Area | Location |
| --- | --- |
| Artifact validation | `pckg/src/Server.Tests/Unit/PackageArtifactValidatorTests.cs` |
| Publish documentation | `pckg/src/Server.Tests/Unit/PackagePublishDocumentationTests.cs` |
| Workspace publish | `pckg/src/Server.Tests/Integration/WorkspacePublishIntegrationTests.cs` |
| Manifest metadata | `pckg/src/Server.Tests/Unit/PackageManifestMetadataReaderTests.cs` |

## Traceability

| Contract | Verification |
| --- | --- |
| `README.md` zip entry | Pack tests + server doc browser smoke |
| `api.json` primary docs model | Publish documentation tests |
| Template `packageKind` | `detect_pack_profile` + server template validators |
| Registry-assigned versions | Server API integration (no client-side version override in CI publish) |

Spec edits **must** stay aligned with `PackageManifestMetadata` and workspace provisioning changes in `pckg/src/Server/Services/Workspace/`.
