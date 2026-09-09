import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Decision

v1 uses a Beskid `contract Encoder` with `EncodeToBytes` / `DecodeFromBytes` returning `Result`. No lossy decode in v1.
