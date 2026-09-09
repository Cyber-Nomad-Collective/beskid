import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

README intent and crate behavior diverged when implementation shipped without a matching platform-spec change set.

## Decision

Implementation that alters observable language or platform behavior **must** be preceded or accompanied by normative spec updates. The spec is the authority; tests and crates are verification anchors, not substitutes for missing contract text. Cross-cutting inception record: **D-INC-0001**.

## Consequences

Contributors pair spec and code in one change set; CI content gates block **Standard** stubs.

## Verification anchors

[Project inception ADR 0001](/platform-spec/community/project-inception/adr/0001-spec-leads-code/); `verify:platform-spec-content`.
