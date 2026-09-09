import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Array lowering depends on whether the linked runtime allocates element storage behind `BeskidArray` headers.

## Decision

| `arrays_backing` | Behavior |
| --- | --- |
| **Enabled** | `array_new` allocates element storage; `ptr` non-null when length > 0 |
| **Disabled** | Header-only arrays; `ptr` may be **null** |
| ABI | Symbol list unchanged; semantics differ by build — document in release matrices |
| Alignment | Shipped CLI/VSIX **should** enable `arrays_backing` for reference user workflows |

## Consequences

Conformance and doc tests **must** pin feature set when asserting array behavior.

## Verification anchors

`beskid_runtime` `array_new`; runtime JIT tests with feature flags.
