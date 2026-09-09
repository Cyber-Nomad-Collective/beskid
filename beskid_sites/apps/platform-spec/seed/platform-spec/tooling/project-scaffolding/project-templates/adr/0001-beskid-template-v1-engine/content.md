import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Foreign template engines would split validation and documentation across ecosystems.

## Decision

The platform **must** use **`beskid.template.v1`** only. Foreign engine schemas are forbidden in spec, CLI, and pckg.

## Consequences

Single parser and validator in tooling; template docs stay in-repo.

## Verification anchors

CI grep excluding foreign schema identifiers under `compiler/` and platform-spec tooling tree.
