import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Cross-platform hosts may translate line endings below the Beskid API.

## Decision

| Rule | Detail |
| --- | --- |
| Ending | `WriteLine` **must** append `\n` only |
| Windows | Host/platform layer **may** translate later without API change |

## Consequences

Authors see consistent Beskid source semantics; CRLF is not encoded in corelib strings.

## Verification anchors

`Output.bd` / `Error.bd` tests; platform IO docs.
