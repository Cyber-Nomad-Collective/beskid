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

Use Getting Started for first installation. Use the VS Code workflow for daily project work after the extension connects to the language server.

## Prerequisites

Identify whether you need an installed extension or help with a daily task. Keep the failed command, view name, or diagnostic if you need recovery help.

## Actions

1. For first installation, [connect VS Code](/docs/getting-started/editor/) and verify one editor diagnostic.
2. For daily project work, [use the VS Code project workflow](/docs/editor/vs-code/) to select project focus and use the product views.

## Expected result

The first installation route ends with a working language server. The daily project work route starts with that connection and uses one project context.

## Recovery

If VS Code has no working Beskid LSP connection, return to [Getting Started](/docs/getting-started/editor/). If the connection works, use the recovery section in the daily workflow.

## Next task

[Use the VS Code project workflow](/docs/editor/vs-code/) after the first diagnostic succeeds.
