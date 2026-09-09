import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Compiler mods and app DI share syntax keywords but different planes.

## Decision

`Mod` projects **must not** declare app **`host`** blocks or alter app composition graphs. Mod registration uses contract **`registrations[]`** per [Compiler Mod SDK](/platform-spec/language-meta/metaprogramming/compiler-mod-sdk/).

## Consequences

Clear boundary between [Pipeline composition](/platform-spec/compiler/pipeline-composition/) (Rust) and app DI (Beskid).

## Verification anchors

[Compiler Mod SDK](/platform-spec/language-meta/metaprogramming/compiler-mod-sdk/); [Mod host bridge](/platform-spec/compiler/compiler-mods/mod-host-bridge/).
