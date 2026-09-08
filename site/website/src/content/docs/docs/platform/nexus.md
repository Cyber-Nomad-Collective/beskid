---
title: Explore a Nexus repository graph
description: Select an indexed repository and inspect its graph, references, processes, and Standard links as a public reader.
pageKind: task
diagramPolicy: required
audience:
  - platform user
authority:
  status: informative
  sourceLabel: Pinned Nexus reader contract
  sourceHref: https://github.com/Cyber-Nomad-Collective/beskid_nexus/blob/eb207de7985ea110c1c0ea7e23f89dd94a66583d/README.md
  limits: Public readers browse indexed graphs. Authentik administrators manage the catalogue and MCP connection. This task does not document administrator credentials.
verified:
  revision: eb207de7985ea110c1c0ea7e23f89dd94a66583d
  date: 2026-09-08
---

Nexus lets public readers browse an indexed repository graph. The root route selects the first indexed repository. Use `?repo=<catalog-id>` to open another indexed repository. Graph administration is an Authentik administrator task.

## Prerequisites

Use a browser and identify an indexed repository. Start from the public Nexus route. Do not use administrator credentials or an MCP connection for graph reading.

## Actions

1. Open the public Nexus root route (`/`).
2. Select an indexed repository from the repository selector.
3. Use `?repo=<catalog-id>` to open a known repository directly.
4. Search symbols to select a node in the repository graph.
5. Open code references or process flows when the selected node provides them.
6. Open a related [Beskid Standard](/docs/standard/) link when the node provides one.

```mermaid
flowchart TD
  accTitle: Nexus reader and administrator boundary
  accDescr: A public reader selects a repository and navigates its graph. Code references, process flows, and Standard links remain reader features. Authentik administrators manage protected controls.
  R[Public reader] --> S[Repository selector]
  S --> G[Graph navigation]
  G --> C[Code references]
  G --> P[Process flows]
  G --> L[Standard links]
  A[Authentik administrator] --> M[Protected management controls]
```

### Diagram text

1. A public reader selects an indexed repository with the repository selector or a direct query.
2. Graph navigation selects nodes and exposes their available code references.
3. Process flows explain detected execution paths when the indexed graph contains them.
4. Standard links lead to related Beskid Standard material when the selected node has indexed links.
5. An Authentik administrator manages protected controls. This role boundary does not give a public reader administrator permissions.

## Expected result

You can view the selected repository graph and inspect a selected code reference, process flow, or Standard link when the index provides it.

## Recovery

If Nexus shows an empty state, no indexed repository is available to read. If it is loading, wait for the graph request to finish before you change the selection. If the public route remains unavailable, record the visible error and use the [Nexus operator contract](/docs/services/nexus/). Do not request administrator credentials.

## Next task

Open [Read Tracker](/docs/platform/tracker/) to read delivery status, or open [Use your account](/docs/platform/account/) for the Hub account page.
