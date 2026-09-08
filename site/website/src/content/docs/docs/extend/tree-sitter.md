---
title: Integrate Tree-sitter
description: Consume or synchronize the Beskid Tree-sitter grammar.
pageKind: task
diagramPolicy: not-needed
diagramOmissionReason: The generated and handwritten boundary table is clearer than a flow diagram.
audience:
  - tool integrator
  - grammar maintainer
authority:
  status: security-sensitive
  sourceLabel: Pinned Beskid Tree-sitter guide
  sourceHref: https://github.com/Cyber-Nomad-Collective/beskid_treesitter/blob/2d17762873a567c9ad61fad526ba240d74f9abf2/README.md
  limits: This page explains package consumption and grammar maintenance. It does not define Beskid syntax.
verified:
  revision: 2d17762873a567c9ad61fad526ba240d74f9abf2
  date: 2026-09-08
---

The published package is `@cyber-nomad-collective/beskid-tree-sitter`. A consumer can keep the shorter `@beskid/tree-sitter` import through an npm alias.

## Prerequisites

Use Node.js 22 for the pinned package workflow. Complete the [shared web package credential setup](/docs/extend/web-packages/) with `read:packages` access before installation.

Use pnpm as the normal package manager. The pinned Tree-sitter publication workflow uses Bun 1.3.0 and a Bun lockfile. Use Bun only to reproduce that pinned component workflow.

Version `0.1.3` is a component-specific exception to the superrepo `@beskid/*` version convention. It is the version in the pinned Tree-sitter package manifest.

| Boundary | Owned source or output |
| --- | --- |
| Handwritten declarations | `scripts/lib/declaration-rules.mjs` |
| Handwritten expressions and conflicts | `scripts/lib/manual-grammar.mjs` |
| Generated grammar | `grammar.js`; generated output, so do not hand-edit it. |
| Generated parser | `src/parser.c` and generated node metadata. |
| Corpus inputs and expected trees | `test/corpus/*.txt` |
| Drift report | `node scripts/check-pest-drift.mjs` |

## Actions

1. Put `"@beskid/tree-sitter": "npm:@cyber-nomad-collective/beskid-tree-sitter@^0.1.3"` in the consumer dependency map.
2. Run `pnpm install` in the consumer repository.
3. Change `scripts/lib/declaration-rules.mjs` or `scripts/lib/manual-grammar.mjs` only when you own a grammar update.
4. Run `./scripts/sync-from-pest.sh` from `beskid_treesitter/` after a grammar-source change.
5. Run `node scripts/check-pest-drift.mjs` to check rule-name drift.
6. Run `bunx tree-sitter test` to verify the generated parser against the corpus.

## Expected result

The consumer resolves the published package through the alias. For a grammar change, the sync updates generated outputs, the corpus tests pass, and the drift check reports no unreviewed rule-name difference.

## Recovery

If `grammar.js` differs without an owned handwritten rule change, regenerate it; do not patch it by hand. If corpus output changes, review the related handwritten rule source and each changed expected tree. Stop when the syntax authority and generated result disagree.

## Next task

[Use the VS Code project workflow](/docs/editor/vs-code/) to verify editor behavior that consumes Beskid language tooling.
