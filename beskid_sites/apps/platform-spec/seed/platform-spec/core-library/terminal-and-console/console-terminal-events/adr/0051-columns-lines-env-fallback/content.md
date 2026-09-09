import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Not all hosts expose Winsize ioctl; env vars are a portable fallback.

## Decision

| Rule | Detail |
| --- | --- |
| Order | Winsize ioctl then `COLUMNS`/`LINES` |
| Parse | Discrete table, not full integer grammar in v1 |

## Consequences

Odd env values may clamp or ignore per contracts article.

## Verification anchors

`Platform/Terminal.bd` tests.
