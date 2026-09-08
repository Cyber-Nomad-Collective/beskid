---
title: Extend Beskid
description: Select a verified integration or extension task.
pageKind: guide
diagramPolicy: not-needed
diagramOmissionReason: The chooser maps each extension goal directly to one focused task.
audience:
  - extension author
  - tool integrator
  - web developer
authority:
  status: informative
  sourceLabel: Pinned Beskid superrepo surface map
  sourceHref: https://github.com/Cyber-Nomad-Collective/beskid/blob/3143396b796d86c1a70a0bfb1aa4761b593bbae5/README.md
  limits: This guide routes extension work. It does not define language, manifest, or service behavior.
verified:
  revision: 3143396b796d86c1a70a0bfb1aa4761b593bbae5
  date: 2026-09-08
---

## Orientation

Use this guide after you can run the applicable Beskid product. Each task uses one pinned implementation source. OpenSpec remains the normative authority for required behavior.

## Choose an extension task

1. Open [Use VS Code projects](/docs/editor/vs-code/) for the installed extension and its project views.
2. Open [Integrate BSOL](/docs/extend/bsol/) for profile selection, validation, and diagnostics.
3. Open [Author a template](/docs/extend/templates/) for scaffold layout, local instantiation, and publication checks.
4. Open [Integrate Tree-sitter](/docs/extend/tree-sitter/) for the consumer package or grammar synchronization.
5. Open [Use shared web packages](/docs/extend/web-packages/) for package identity, aliases, credentials, and package gates.

## Limits

These tasks explain current integration procedures. They do not restate a normative schema. They do not publish a package or change a service unless a task explicitly identifies that effect.

Stop when the pinned source and the current checkout disagree. Record the source revision and the mismatch for the owning repository.

## Next steps

Start with [BSOL integration](/docs/extend/bsol/), or select the task that owns your target surface.
