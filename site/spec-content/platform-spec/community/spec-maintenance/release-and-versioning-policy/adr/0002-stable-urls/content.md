---
title: Stable platform-spec URLs across releases
description: Behavioral change edits normative text and metadata, not path version segments.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-COMM-VERS-0002
adrStatus: Accepted
adrDate: 2026-05-05
lastReviewed: 2026-05-22
---

## Context

Renaming or version-prefixing feature paths broke bookmarks and `relatedTopics` links across domains.

## Decision

Feature and language-meta paths **must** remain stable across releases. Behavioral change is expressed by editing normative text and metadata (`status`, `lastReviewed`, embedded decisions), not by introducing version segments in site paths.

## Consequences

Redirects handle legacy Starlight paths; normative slugs under `platform-spec/` stay fixed.

## Verification anchors

`site/website` Astro routes; platform-spec nav tree generation.
