import SpecArticleChrome from '@beskid/beskid-ui/platform-spec/SpecArticleChrome.astro';

<SpecArticleChrome />

## Purpose

Document **verification and traceability** for the **Console Capabilities** feature: role-specific normative detail beyond the feature hub.

## Canonical references

- Feature hub: [Console Capabilities](/platform-spec/core-library/terminal-and-console/console-capabilities/)
- Sibling articles in this bundle (design model, contracts, flow, examples, verification)

## Detailed behavior

| Artifact | Role |
| --- | --- |
| `Console/Capabilities.bd` | `ProbeStdout`, `ShouldEmitAnsi`, strip logic |
| `Platform/Terminal.bd` | `ProbeColorModel`, `ForcePlainText`, `IsAtty` |
| `CapabilitiesTests.bd` | Strip vs emit behavior |
| `AnsiEscapeTests.bd` | Conditional empty sequences when ANSI disabled |

Changes to **CAP-001**–**CAP-005** **must** extend `CapabilitiesTests.bd` or ANSI golden tests that assert gating.

## Verification

See the verification and traceability article in this bundle and `compiler/corelib/beskid_corelib/tests/corelib_tests/src/console/`.

## Related topics

- Parent [feature hub](/platform-spec/core-library/terminal-and-console/console-capabilities/) and [Terminal and console area](/platform-spec/core-library/terminal-and-console/)
