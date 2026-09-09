import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Bulk C-style surfaces need stable contract blocks; module-level extern was exploratory.

## Decision

**`Extern`** **must** apply only to **`contract`** declarations in v0.3 Standard. The reference compiler **must** reject **`Extern`** on non-contract declarations (**E1510**).

## Consequences

Codegen collects `ExternImport` from contract metadata; mod-level extern remains non-Standard.

## Verification anchors

`compiler/crates/beskid_analysis/src/types/context/context.rs`; [extern attribute schema](/platform-spec/language-meta/interop/ffi-and-extern/extern-attribute-schema/).
