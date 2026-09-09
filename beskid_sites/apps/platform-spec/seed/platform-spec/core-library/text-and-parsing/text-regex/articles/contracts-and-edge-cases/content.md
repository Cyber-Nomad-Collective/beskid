import SpecArticleChrome from '@beskid/beskid-ui/platform-spec/SpecArticleChrome.astro';

<SpecArticleChrome />

## Normative requirements

| ID | Requirement |
| --- | --- |
| **REGEX-001** | Pattern syntax **must** be defined by `regex.pest`. |
| **REGEX-002** | Input length **must** be capped at 1 MiB code units. |
| **REGEX-003** | `Match` **must** return `Option<MatchSpan>` with byte offsets. |
| **REGEX-004** | `Find` **must** return the leftmost first match anywhere in the subject. |
| **REGEX-005** | `FindAll` **must** return non-overlapping matches in left-to-right order. |
| **REGEX-006** | Invalid patterns **must** yield `None` / empty results without panic. |
