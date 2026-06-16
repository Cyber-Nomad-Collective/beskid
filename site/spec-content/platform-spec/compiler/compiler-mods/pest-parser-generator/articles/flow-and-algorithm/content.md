---
title: Flow and algorithm
description: Rebuild pipeline for grammar codegen.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-06-08
---

## Flow

1. Consumer project declares `grammar { roots, grammarOutput }` in `.bproj`.
2. `beskid mod rebuild` builds the grammar mod AOT artifact (`corelib_pest_gen`).
3. On fingerprint miss, the mod's `GrammarGenerator` uses `Core.Text.Pest` to parse `.pest` sources and emit combinator `.bd` files (PascalCase callables, camelCase locals).
4. Host materializes typed output under the mod's `generatedOutput` root.
5. Consumer imports generated parsers from the declared `module` path.
