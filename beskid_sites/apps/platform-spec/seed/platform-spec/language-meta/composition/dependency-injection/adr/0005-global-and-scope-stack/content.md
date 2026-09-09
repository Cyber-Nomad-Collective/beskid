import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Authors need predictable scope boundaries for web and console activation patterns.

## Decision

| Construct | Rule |
| --- | --- |
| **Global** | Merged **`registry`** of the launched host after inheritance chain |
| **Named `scope`** | Tree under global; per-activation unless `single` / `transient` |
| **Stack** | Fiber-local scope stack during **`with`** |
| **Resolution** | Walk innermost → global; **`global::`** and **`parent::`** qualifiers as specified |

## Consequences

Execution backends maintain scope enter/leave with **`with`**; plural inject collects at lowest matching level.

## Verification anchors

[Design model](/platform-spec/language-meta/composition/dependency-injection/design-model/); [Execution](/platform-spec/execution/).
