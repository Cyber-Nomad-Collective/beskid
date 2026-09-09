import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Platform-spec domains multiplied without a single place for “what valid Beskid code means,” inviting duplicate type and evaluation tables in compiler and tooling chapters.

## Decision

**Language law** — syntax, types, evaluation, contracts, memory, and cross-cutting language rules — **must** be defined only under [Language meta](/platform-spec/language-meta/), except where another domain page declares an explicit **cross-domain exception** and links to the owning language-meta chapter.

## Consequences

New language semantics start in language-meta; implementation domains link back instead of redefining tables.

## Verification anchors

`packages/trudoc/src/verify/platform-spec-content.ts`; `cd site/website && bun run verify:trudoc -- --preset ci`.
