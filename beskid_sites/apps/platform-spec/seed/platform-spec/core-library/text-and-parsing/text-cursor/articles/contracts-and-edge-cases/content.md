import SpecArticleChrome from '@beskid/beskid-ui/platform-spec/SpecArticleChrome.astro';

<SpecArticleChrome />

## Normative requirements

| ID | Requirement |
| --- | --- |
| **CURSOR-001** | `Cursor` **must** track `{ source: string, pos: i64 }`. |
| **CURSOR-002** | `Slice`, `Drop`, `Peek`, `Advance` **must** be bounds-safe. |
| **CURSOR-003** | `Position` **must** return current byte offset. |
| **CURSOR-004** | Hot paths **must not** allocate except `Slice`/`Drop` views. |
