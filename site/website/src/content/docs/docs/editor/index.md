---
title: Editor workflows
description: Select the VS Code task that matches your current Beskid work.
pageKind: guide
diagramPolicy: not-needed
diagramOmissionReason: The chooser has two direct routes, so a diagram would repeat the links.
audience:
  - newcomer
  - developer
authority:
  status: informative
  sourceLabel: Pinned Beskid VS Code extension guide
  sourceHref: https://github.com/Cyber-Nomad-Collective/beskid_vscode/blob/94640e47f3292a883cb2f92c4a04321f8724a3f7/README.md
  limits: This guide routes editor tasks. The extension implementation defines the available interface behavior.
verified:
  revision: 94640e47f3292a883cb2f92c4a04321f8724a3f7
  date: 2026-09-08
---

## Orientation

This guide separates first installation from daily project work. The installation task verifies one language-server diagnostic. The daily workflow starts after that verification.

## Choose a workflow

1. Open [Connect VS Code](/docs/getting-started/editor/) for first installation or a failed initial connection.
2. Open [Use the VS Code project workflow](/docs/editor/vs-code/) for daily project work with an installed extension.

## Limits

This guide only routes editor tasks. The extension implementation defines the available UI. The Beskid Standard remains normative for language and manifest behavior.

Use the Beskid LSP output from the selected task for recovery. Do not use this chooser as an extension-development or service-operation procedure.

## Next steps

Complete [the first installation](/docs/getting-started/editor/), or continue to [daily project work](/docs/editor/vs-code/) after the first diagnostic succeeds.
