---
title: "Package public surface"
description: What registry consumers see is what you exported and documented, not your folder tree.
tableOfContents: true
---

**pckg** consumers and the docs UI see your package through **`api.json`** and resolved exports. If it is not `pub` (or re-exported with `pub use`), it is not part of your moral public API even if GitHub can read the file.

`api.json` and its Markdown companion are generated, not written; see [Doc and api.json](/book/16-corelib-batteries-with-opinions/doc-and-api-json/) for what the compiler puts in them and how `beskid pckg pack` ships them inside the `.bpk`.

## Tie documentation to exports

- Document public callables with `///` (chapter 20).
- `beskid pckg pack` runs the doc pass automatically for library packages, so `api.json` exists before the artifact is assembled.
- `beskid pckg upload` is the step that actually publishes; there is no dry-run flag on it, so review what `pack` produced before you upload.
