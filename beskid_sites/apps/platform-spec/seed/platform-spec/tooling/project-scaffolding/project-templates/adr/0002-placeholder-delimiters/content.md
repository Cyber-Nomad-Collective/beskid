import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Template authors need delimiter syntax distinct from Beskid source.

## Decision

Text files **must** use **`{{symbolName}}`** placeholders; optional **`sourceName`** rewriting applies to paths and identifiers.

## Consequences

Editors can highlight unmatched braces; substitution tests stay deterministic.

## Verification anchors

Golden substitution tests under planned `beskid_tests` template fixtures.
