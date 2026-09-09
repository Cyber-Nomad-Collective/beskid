import SpecArticleChrome from '@beskid/beskid-ui/platform-spec/SpecArticleChrome.astro';

<SpecArticleChrome />

## Purpose and scope

Traceability for pckg template profile implementation.

## Tests

| Test | Location (planned) |
| --- | --- |
| Template `.bpk` validates without `api.json` | `pckg/src/Server.Tests/Unit/PackageArtifactValidatorTests.cs` |
| Library `.bpk` still requires `api.json` when policy on | same |
| Template package page hides docs | `Server.Tests` integration or bUnit on package detail |
| Pack sets `packageKind: template` | `beskid_tests` pack golden `package.json` |

## Manual QA

1. Publish `beskid.templates.console` to test registry.
2. Open package page — confirm no API docs tab.
3. `beskid new install beskid.templates.console` — success.
4. Yank version — `beskid new console` prints warning.
