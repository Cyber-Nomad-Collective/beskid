---
title: Packages
description: Publish immutable Beskid package versions and consume them through project resolution.
pageKind: guide
diagramPolicy: required
audience:
  - package author
  - developer
authority:
  status: informative
  sourceLabel: Pinned Beskid package CLI implementation
  sourceHref: https://github.com/Cyber-Nomad-Collective/beskid_compiler/blob/252aa528ac7ee01a64e49e9b88b32393206fbd71/crates/beskid_pckg/src/cli.rs
  limits: This page explains verified package tasks. Registry policy and the Beskid Standard remain authoritative.
verified:
  revision: 252aa528ac7ee01a64e49e9b88b32393206fbd71
  date: 2026-09-08
---

The registry stores a `.bpk` artifact at an immutable package name-and-version coordinate. Use `beskid pckg` for ordinary package commands. The equivalent grouped form is `beskid dev package registry`; this guide uses the concise form.

## Prerequisites

A package author needs a package name and a publisher API key with publish scope. A package consumer needs the package name and an exact active version.

## Actions

1. [Configure credentials and recovery](/docs/packages/credentials-and-recovery/) before a package mutation.
2. [Create, pack, inspect, and upload a package](/docs/packages/publish/).
3. [Consume the exact package version](/docs/packages/consume/) through a project manifest and lockfile.

```mermaid
sequenceDiagram
  accTitle: Package publication and consumption
  accDescr: A package author creates a record and uploads an artifact. A consumer requests a version and verifies the resolver result before accepting the lockfile.
  participant A as Author
  participant R as Registry
  participant C as Consumer
  A->>R: Create package record
  A->>R: Upload .bpk
  R-->>A: Immutable name and version
  C->>R: Request version
  alt requested active version exists
    R-->>C: Requested version
  else requested version is absent
    R-->>C: Fallback first active
  end
  C->>C: Materialize dependency
  C->>C: Update Project.lock
  C->>C: Inspect resolved_version
```

### Diagram text

The package author first creates the package record. The author then packs and uploads one artifact. The registry assigns that artifact to an immutable name-and-version coordinate. A package consumer requests a version in the project manifest. The resolver can fall back to the first active version when the request is absent. Fetch materializes the selected artifact and writes `Project.lock`. The consumer then inspects `resolved_version` and stops all later work on a mismatch. A yanked version is not available for a new download.

## Expected result

The author can verify one immutable name-and-version coordinate and its checksum. The consumer has a reviewed `Project.lock` and a materialized leaf under `obj/beskid/deps/src/<materialized-id>`.

## Recovery

If identity, checksum, or generated documentation is wrong, do not upload the artifact. The resolver can fall back, which is an implementation limitation under reconciliation. Stop when the lockfile differs from the request. Use [credentials and recovery](/docs/packages/credentials-and-recovery/) for authentication failures, yanking, and key rotation.

## Next task

[Publish a package](/docs/packages/publish/) or [consume a package](/docs/packages/consume/).
