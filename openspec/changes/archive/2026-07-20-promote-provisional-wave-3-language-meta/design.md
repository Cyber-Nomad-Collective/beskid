## Context

Provisional capabilities contain one non-citeable stub requirement. Migrated
source text under Informative Source Provenance already describes intended
behavior for the sixteen language-meta wave-3 targets (CYB-54 Cursor wave D).

## Decisions

1. **Extract, do not invent.** Every ADDED requirement MUST be grounded in the
   capability's Migrated source text (Normative specification / SpecSection
   bodies, or accepted ADR decisions inside that provenance).
2. **Delta shape.** Each delta removes the `* conformance status` provisional
   requirement and adds one or more named SHALL/MUST requirements with at least
   one GIVEN/WHEN/THEN scenario each.
3. **Main specs updated in-change.** Requirements sections in
   `openspec/specs/<capability>/spec.md` are rewritten to match ADDED content;
   provenance blocks stay. Archive uses `--skip-specs` because main specs are
   already applied.
4. **Stable IDs.** Drop provisional Stable ID lines with the removed requirement;
   catalog rebuild (deferred) assigns IDs for new requirements.
5. **Provenance stays.** Do not delete Informative Source Provenance or
   `<!-- migrated from the legacy platform spec -->` banners.
6. **No code gates / no catalog.** Implementation anchors remain informative;
   `openspec:catalog` is intentionally not run in this wave.

## Risks

- Over-promoting aspirational article text as normative. Mitigate by preferring
  Normative specification / SpecSection bodies over Articles indexes.
- Catalog provisional count stays stale until a later catalog refresh. Mitigate
  by documenting deferral in proposal Impact.
