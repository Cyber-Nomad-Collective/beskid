---
title: "Verify docs in CI"
description: Typed-link tests catch documentation drift; OpenSpec edits belong in the same change set as behavior.
tableOfContents: true
---

Website and Book changes run through **`bun run test:docs-links`** and **`bun run build`** in `site/website`. Normative changes are validated separately from the repository root with **`openspec validate --all --strict`**.

## Contributor loop

1. Change behavior → update platform-spec if observable.
2. Update `///` and run `beskid doc` for packages you publish.
3. Run verify before claiming green CI.

## Next

[21. FFI and forbidden friendships](/book/21-ffi-and-forbidden-friendships/)
