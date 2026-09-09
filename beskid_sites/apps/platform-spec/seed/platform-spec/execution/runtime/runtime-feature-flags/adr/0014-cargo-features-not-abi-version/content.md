import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

CI and VSIX builds enable different `beskid_runtime` features. Confusing feature gates with ABI bumps breaks compatibility checks.

## Decision

| Concept | Rule |
| --- | --- |
| `BESKID_RUNTIME_ABI_VERSION` | Changes only on breaking layout/signature per **D-EXEC-ABI-0002** |
| Cargo `features` | `metrics`, `arrays_backing`, `sched` — build-time toggles |
| Additive exports | New feature-gated symbols **may** ship without ABI bump if old artifacts never import them |
| Shipped binaries | **Must** document enabled features in release notes |
| Tests | Compiler tests enable features explicitly when validating optional paths |

## Consequences

Mismatch (test expects `arrays_backing`, default runtime does not) fails logically without ABI version inequality.

## Verification anchors

`beskid_runtime/Cargo.toml`; [design model](../design-model/) feature table.
