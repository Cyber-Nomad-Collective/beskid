## Context

Three provisional core-library capabilities retain rich Migrated source with
lowercase **must** contract tables or registration-order obligations. Two
singles (`architecture`, `standard-governance`) have empty or overview-only
provenance and cannot be promoted without inventing behavior.

## Decisions

1. **Extract, do not invent.** Every ADDED requirement MUST be grounded in the
   capability's Migrated source text (normative tables, contract statements, or
   registration-order prose).
2. **Delta shape.** Each delta removes the `* conformance status` provisional
   requirement and adds named SHALL/MUST requirements with at least one
   GIVEN/WHEN/THEN scenario each.
3. **Stable IDs.** Drop provisional Stable ID lines with the removed requirement;
   catalog rebuild (out of scope) assigns IDs for new requirements.
4. **Provenance stays.** Do not delete Informative Source Provenance or
   `<!-- migrated from the legacy platform spec -->` banners.
5. **Skip empty singles.** Do not promote `community--spec-maintenance--architecture`
   or `standard-governance` in this wave.
6. **No code gates.** Implementation anchors remain informative; harness wiring
   is a later change.
7. **Archive with `--skip-specs`.** Main specs are updated in-place alongside
   deltas; archive must not re-merge.

## Risks

- Over-promoting aspirational article text. Mitigate by preferring Normative
  requirements tables and explicit registration-order **must** statements.
- Skipped singles remain provisional until richer source is authored.
