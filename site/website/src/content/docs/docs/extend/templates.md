---
title: Author a Beskid Template
description: Create and verify a first-party template without publishing it.
pageKind: task
diagramPolicy: not-needed
diagramOmissionReason: The layout and verification tables show the linear authoring procedure.
audience:
  - template author
  - contributor
authority:
  status: informative
  sourceLabel: Pinned first-party template guide
  sourceHref: https://github.com/Cyber-Nomad-Collective/beskid_templates/blob/33fce0b840d4de318c804f7fc7396a0a93bb165a/README.md
  limits: This page explains the pinned template workflow. It does not define the template schema or perform a registry publication.
verified:
  revision: 33fce0b840d4de318c804f7fc7396a0a93bb165a
  date: 2026-09-08
---

First-party templates use the `beskid.templates.*` registry namespace. A template authoring tree is not a runnable Beskid project.

## Prerequisites

Use an initialized superrepo with the pinned `beskid_templates` gitlink. Choose an empty output path for local instantiation. Work from the superrepo root for the publication dry-run.

| Authoring path | Purpose |
| --- | --- |
| `<package>/.beskid/template.json` | Engine manifest for the authoring tree. |
| `<package>/<name>.bproj` | Package metadata and template identity. |
| `<package>/content/`, `workspace/`, or `item/` | Files copied to template output. |
| `beskid_templates.bws` | Workspace membership for all template packages. |
| `workspace.package.json` | Publication metadata for the seven registry packages. |

## Actions

1. Inspect `.beskid/template.json` in the template package that you own.
2. Use only `{{symbolId}}` placeholders in copied source paths and content.
3. Run `beskid new --path ./packages/console -n Demo -o ./Demo` from `beskid_templates/` to test local-path instantiation.
4. Inspect the generated template output without editing the authoring source through that output.
5. Run `bash scripts/ci/corelib-publish.sh --dry-run` from the initialized superrepo root.

## Expected result

Local instantiation creates template output at the selected empty path. The publication dry-run validates and packs the complete first-party set. It performs no registry write and needs no publication credential.

## Recovery

If generated output is wrong, change the owned authoring tree and instantiate into a new empty path. If the dry-run fails, stop at the first failing artifact. Do not continue to a registry write.

Do not add a corelib opt-out key to emitted project manifests. Follow the pinned source and the linked normative authority when the expected shape is unclear.

## Next task

[Create a project](/docs/projects/create/) from a verified template, or [publish a package](/docs/packages/publish/) after the owning release workflow approves it.
