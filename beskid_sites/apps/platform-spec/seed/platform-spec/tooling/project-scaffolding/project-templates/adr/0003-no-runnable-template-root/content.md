import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Requiring `beskid build` on template sources slows authoring and blocks non-host template layouts.

## Decision

Template packages **need not** compile at the template project root. Tooling **must** validate via instantiation output builds.

## Consequences

Faster template iteration; CI runs instantiate-then-build on consumer output.

## Verification anchors

`beskid.templates.*` CI pipeline; planned `beskid_tests` template fixtures.
