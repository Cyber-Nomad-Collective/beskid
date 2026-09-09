import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Pipeline and host details were written as if they owned user-visible meaning, overlapping language-meta chapters.

## Decision

[Compiler](/platform-spec/compiler/), [Execution](/platform-spec/execution/), [Core library](/platform-spec/core-library/), and [Tooling](/platform-spec/tooling/) specify *how the reference platform realizes* language-meta. They **must not** redefine semantics already owned there; they **must** defer with `relatedTopics` (for example `defers-to`, `implements`) instead of duplicating normative key tables.

## Consequences

Classification happens before authoring: “what does valid code mean?” → language-meta first; crates and phases link back.

## Verification anchors

`relatedTopics` frontmatter validation in `verify:trudoc --preset ci`.
