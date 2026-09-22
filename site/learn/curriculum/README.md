# Beskid Learn curriculum

This directory is the sole authored source for Learn. `manifest.json` names
every permitted context and lesson package in learning order; it is not a
filesystem discovery convention. The generator reads only those paths and
derives `../src/data/generatedLearningCatalog.ts` for the React app.

Each package has `lesson.md`, `start.bd`, `solution.bd`, and `check.json`.
Read [TEMPLATE.md](TEMPLATE.md) before authoring a lesson: it defines required
front matter, headings, acceptance metadata, pedagogy, and reference-only
rules.

Useful commands from `site/learn`:

- `pnpm run curriculum:validate` validates the manifest and authored packages.
- `pnpm run curriculum:build` validates and regenerates the catalog.
- `pnpm run curriculum:check-generated` proves the committed catalog is current.
- `pnpm run lesson:check <lesson-id>` checks the declared interactive starter
  and solution using the command declared in lesson metadata.
- `pnpm run check:all` validates first, then checks all manifest-listed
  interactive lessons only.

Never add a numbered directory and expect it to run automatically. Add it to
the manifest, give it a stable id, and declare its prerequisite edges.
