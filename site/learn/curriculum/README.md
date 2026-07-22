# Beskid Learn curriculum

This folder holds the rustlings-style exercise source of truth.

- Each lesson has `lesson.md` (instructions), `start.bd` (what the user edits), and
  `solution.bd` (reference implementation).
- The web learn surface pulls exercise metadata from `src/data/learningCatalog.ts`.
- Lesson IDs are intentionally numeric-prefix directories so both CLI (`check:all`) and
  web navigation stay deterministic.
- Command coverage now includes `analyze`, `parse`, and `tree`.
- New exercise template:

```text
01-lesson-name/
  lesson.md
  start.bd
  solution.bd
```
