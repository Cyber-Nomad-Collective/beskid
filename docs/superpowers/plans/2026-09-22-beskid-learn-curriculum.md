# Beskid Learn Curriculum Implementation Plan

**Goal:** Replace Learn’s duplicated command-tour content with a generated,
Markdown-source-of-truth curriculum that covers source-backed Beskid concepts
from `Main` through fibers and accurately labels implementation status.

**Spec:** `docs/superpowers/specs/2026-09-22-beskid-learn-curriculum-design.md`

## Work slices

1. Create the nested curriculum schema, template, manifest, and source rules.
2. Generate the public TypeScript catalog from authored Markdown and make
   manifest-driven validation/checking replace flat directory discovery.
3. Author orientation through collections/loops, preserving only verified
   interactive examples.
4. Author module, contract, closure, core-library, and advanced contexts with
   explicit availability labels.
5. Author the complete fibers/channels progression without suggesting an
   ordering guarantee or thread/async equivalence.
6. Remove legacy duplicated lessons and verify schema, every executable
   lesson, TypeScript tests/build, diff whitespace, and changed-flow impact.

## Constraints

- OpenSpec and executable compiler evidence outrank illustrative code.
- Preserve all unrelated dirty changes in the main checkout.
- The user explicitly declined a TDD workflow; use the stated validation gates.
- Update `site/learn/CHANGELOG.md` in Keep a Changelog form.
