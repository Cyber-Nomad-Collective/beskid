## Context

Provisional capabilities contain one non-citeable stub requirement. Migrated
source text under Informative Source Provenance already describes intended
behavior for the twelve wave-1 targets.

## Decisions

1. **Extract, do not invent.** Every ADDED requirement MUST be grounded in the
   capability's Migrated source text (or an accepted ADR inside that provenance).
2. **Delta shape.** Each delta removes the `* conformance status` provisional
   requirement and adds one or more named SHALL/MUST requirements with at least
   one GIVEN/WHEN/THEN scenario each.
3. **Stable IDs.** Drop provisional Stable ID lines with the removed requirement;
   catalog rebuild assigns IDs for new requirements.
4. **Provenance stays.** Do not delete Informative Source Provenance or
   `<!-- migrated from the legacy platform spec -->` banners.
5. **No code gates in this wave.** Implementation anchors remain informative;
   conformance harness wiring is a later change.

## Risks

- Over-promoting aspirational article text as normative. Mitigate by preferring
  sections titled Normative behavior, Command surface, or ADR decisions, and by
  keeping scenarios testable.
- Catalog hash drift. Mitigate by regenerating `openspec/catalog.json` after
  archive.
