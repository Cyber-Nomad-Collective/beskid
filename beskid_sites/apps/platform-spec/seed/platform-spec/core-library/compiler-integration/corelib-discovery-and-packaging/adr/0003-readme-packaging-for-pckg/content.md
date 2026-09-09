import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Registry consumers expect root README.md in `.bpk` artifacts.

## Decision

| Rule | Detail |
| --- | --- |
| Declare | Optional `readme = "path.md"` in Project.proj |
| Default | `readme.md` at package root when present |
| Pack | `beskid pckg pack` places resolved file as **`README.md`** |

## Consequences

pckg documentation ingest uses consistent entry filename.

## Verification anchors

`PackagePublishDocumentation.cs`; pack integration tests.
