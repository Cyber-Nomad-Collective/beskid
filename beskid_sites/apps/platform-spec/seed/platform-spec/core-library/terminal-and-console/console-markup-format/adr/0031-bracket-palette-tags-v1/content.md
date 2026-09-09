import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Arbitrary RGB in markup v1 would bypass capability downgrade rules.

## Decision

| Rule | Detail |
| --- | --- |
| Tags | `[red]`-style names map to fixed palette |
| RGB | Not supported inside markup v1 |

## Consequences

Authors use Ansi builders for advanced color outside markup.

## Verification anchors

`FormatAttributesTests.bd`.
