import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Authors need portable cursor stacking without SCO-specific CSI variants in typed builders.

## Decision

| Rule | Detail |
| --- | --- |
| Save/restore | **DEC** `ESC 7` / `ESC 8` is the normative pair |
| SCO | `CSI s` / `CSI u` are **not** required in v1 typed builders |

## Consequences

Typed `Ansi.Cursor` helpers emit DEC only; raw `Csi` may still be used in tests.

## Verification anchors

`AnsiEscapeTests.bd`; `ANSI.md` tables.
