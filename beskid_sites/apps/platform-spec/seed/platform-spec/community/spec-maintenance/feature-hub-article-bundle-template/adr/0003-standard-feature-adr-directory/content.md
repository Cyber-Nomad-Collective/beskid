import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

**Standard** features shipped without traceable closed choices, blocking the reader **ADRs** tab.

## Decision

Every **Standard** feature hub **must** include **`## Decisions`** (open items or **no open decisions** plus `adrId` pointers) and publish at least one `` `adr/<slug>.mdx` `` with `specLevel: adr` unless explicitly exempt in a **Standard** maintenance policy. Each ADR **must** include **Context**, **Decision**, and **Consequences**. New decisions **must not** be added only to monolithic decision tables.

## Consequences

Reference: [Concurrency package ADRs](/platform-spec/core-library/concurrency/concurrency-package/adr/0001-channel-default-unbounded/). Legacy `decisions-record.mdx` is migration-only.

## Verification anchors

`PSC003` in `platform-spec-content.ts`.
