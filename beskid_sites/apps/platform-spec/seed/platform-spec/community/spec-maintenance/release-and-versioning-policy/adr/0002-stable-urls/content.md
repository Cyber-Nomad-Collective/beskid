import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Renaming or version-prefixing feature paths broke bookmarks and `relatedTopics` links across domains.

## Decision

Feature and language-meta paths **must** remain stable across releases. Behavioral change is expressed by editing normative text and metadata (`status`, `lastReviewed`, embedded decisions), not by introducing version segments in site paths.

## Consequences

Redirects handle legacy Starlight paths; normative slugs under `platform-spec/` stay fixed.

## Verification anchors

`site/website` Astro routes; platform-spec nav tree generation.
