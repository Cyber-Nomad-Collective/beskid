---
title: "Verify docs in CI"
description: trudoc presets catch spec drift; platform-spec edits belong in the same change set as behavior.
tableOfContents: true
---

Website and book changes run through **`bun run verify:trudoc -- --preset ci`** in `site/website` (includes platform-spec content checks when you touch normative trees).

## Contributor loop

1. Change behavior → update platform-spec if observable.
2. Update `///` and run `beskid doc` for packages you publish.
3. Run verify before claiming green CI.

## Next

[21. FFI and forbidden friendships](/book/21-ffi-and-forbidden-friendships/)
