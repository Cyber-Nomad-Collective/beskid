import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

**Standard** pages shipped with circular stubs or without decisions, while readers treated every platform-spec URL as enforceable law.

## Decision

| `status` | Meaning | Requirements |
| --- | --- | --- |
| **Proposed** | Incomplete or unstable | May omit full verification anchors; **must not** be cited as enforceable language law in conformance arguments |
| **Standard** | Enforceable platform contract | **Must** include normative MUST/SHOULD/MAY prose, verification anchors, and hub **`## Decisions`** (or linked `decisions-record`) |

Any **Standard** page failing content gates (circular canon stubs, placeholder-only bundles, missing decisions) **must** downgrade to **Proposed** until restored.

## Consequences

Maturity is explicit in frontmatter; CI strict mode can fail scaffold **Standard** pages.

## Verification anchors

`verify:platform-spec-content` with `--strict`; `LANGUAGE_META_CIRCULAR_CANON_ALLOWLIST` for tracked exceptions.
