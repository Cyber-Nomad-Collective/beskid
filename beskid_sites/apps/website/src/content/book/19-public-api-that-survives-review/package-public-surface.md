---
title: "Package public surface"
description: What registry consumers see is what you exported and documented—not your folder tree.
tableOfContents: true
---

**pckg** consumers and the docs UI see your package through **`api.json`** and resolved exports. If it is not `pub` (or re-exported), it is not part of your moral public API even if GitHub can read the file.

## Tie documentation to exports

- Document public callables with `///` (chapter 20).
- Run `beskid doc` before publish (chapter 16).
- Dry-run publish catches manifest lies early: `beskid pckg publish --dry-run`.

## Next

[20. /// comments that are not lies](/book/20-doc-comments-that-are-not-lies/)
