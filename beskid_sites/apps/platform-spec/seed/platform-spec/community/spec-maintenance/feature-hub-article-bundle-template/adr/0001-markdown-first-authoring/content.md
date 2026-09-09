import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Heavy Astro component usage made diffs noisy and hid normative prose from content validators.

## Decision

Every new or reworked topic **must** choose one canonical level: **Domain**, **Area**, or **Feature**. Regular sections **must** be markdown headings/lists/admonitions first. Architecture visuals **must** use fenced `arch` (Mermaid C4); procedural flows **may** use fenced `mermaid`. Inline graph components in docs are legacy-only. Generics in prose **must** use one backtick literal per type; Mermaid labels **must not** contain raw `` `<` `` or `` `>` ``.

## Consequences

Component usage requires a rationale note; tables stay sparse.

## Verification anchors

`remark-arch-code-fence`; layout `minMarkdownHeadings` where enabled.
