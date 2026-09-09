import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Runtime DI containers hide wiring and conflict with the project's explicit composition goals (distinct from Rust pipeline IoC in D-INC-0002).

## Decision

The reference compiler **must** fully resolve the app composition graph at compile time. Backends **must not** perform runtime service lookup for **`host`** / **`registry`** / **`scope`** wiring.

## Consequences

Lowering emits ctor wiring and scope enter/leave; execution hosts activate frozen graphs only.

## Verification anchors

`compiler/crates/beskid_analysis` (planned `composition` module); `compiler/crates/beskid_codegen`; [Flow and algorithm](/platform-spec/language-meta/composition/dependency-injection/flow-and-algorithm/).
