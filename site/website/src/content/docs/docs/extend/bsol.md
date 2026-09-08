---
title: Integrate BSOL
description: Select a BSOL profile and interpret validation diagnostics.
pageKind: task
diagramPolicy: not-needed
diagramOmissionReason: The profile and diagnostic tables show this linear validation procedure more precisely.
audience:
  - extension author
  - tool integrator
authority:
  status: informative
  sourceLabel: Pinned BSOL integration guide
  sourceHref: https://github.com/Cyber-Nomad-Collective/beskid_bsol/blob/2ed5f1283ca7395e2c1ebd34b42f2d0f4fb93260/README.md
  limits: This page explains the integration sequence. OpenSpec defines required Beskid behavior and the pinned BSOL source defines its implementation.
verified:
  revision: 2ed5f1283ca7395e2c1ebd34b42f2d0f4fb93260
  date: 2026-09-08
---

BSOL is the Beskid Structured Object Language. Use it for a supported structured document. Do not use this page as a copy of a normative schema.

## Prerequisites

Identify the BSOL document family before you select a profile. Use the pinned BSOL source for implementation behavior. Use OpenSpec as the normative authority for required Beskid behavior.

The pinned BSOL source provides these embedded profile choices:

| Document family | Available profile |
| --- | --- |
| Project manifest | `project.v1` or `project.v2` |
| Workspace manifest | `workspace.v1` |
| Runtime manifest | `runtime.v1` or `runtime.v2` |
| Board layout | `board.v1`, `board.v2`, or `board.v3` |
| Shell pages | `shell.pages.v1` |
| Tool configuration | `tools.config.v1` |
| Shared configuration | `configuration.v1` or `configuration.v2` |
| Profile document | `schema.v1` or `schema.v2` |

This table identifies profiles. It does not reproduce their field rules.

## Actions

1. Choose the profile that matches the document family and supported version.
2. Run `beskid validate-bsol --profile project.v1 path/to/file.bproj` with the selected profile in place of `project.v1`.
3. Inspect each diagnostic with its source location and validation phase.

## Expected result

The command validates the document with the selected profile. A failure identifies a source location and gives a parse, schema, or semantic message.

| Diagnostic phase | Meaning |
| --- | --- |
| Parse | The source does not form a BSOL document. |
| Schema | The parsed document does not satisfy the selected profile. |
| Semantic | A registered validation rule rejects the structured value. |

## Recovery

For a parse diagnostic, correct the reported BSOL source location. For a schema diagnostic, confirm the document family and selected profile before you edit data. For a semantic diagnostic, use the rule name and source location to contact the validator owner.

If the profile behavior conflicts with OpenSpec, stop. Do not invent a corrected schema in Docs.

## Next task

[Author a template](/docs/extend/templates/) when the validated document belongs to a scaffold package.
