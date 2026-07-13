---
title: "Verify docs in CI"
description: Typed-link tests catch documentation drift; OpenSpec edits belong in the same change set as behavior.
tableOfContents: true
---

Website and Book changes run through **`bun run test:docs-links`** and **`bun run build`** in `site/website`. Normative changes are validated separately from the repository root with **`openspec validate --all --strict`**.

Run the checks that match the change: link checks for Book navigation, the site build for rendered pages, and standard validation for changes to the normative corpus. A passing documentation build does not validate a changed language rule.

## Contributor loop

1. Change behavior → update platform-spec if observable.
2. Update `///` and run `beskid doc` for packages you publish.
3. Run verify before claiming green CI.

If a rendered guide and the standard disagree, update or clarify the guide and keep the standard link visible. Do not copy a requirement into the Book merely to make the page self-contained.

## Related standard pages

- [Documentation comments](/platform-spec/language-meta/surface-syntax/documentation-comments/)
- [Specification authority and decisions](/platform-spec/community/spec-maintenance/spec-authority-and-decisions/)

## Next

[21. FFI and forbidden friendships](/book/21-ffi-and-forbidden-friendships/)
