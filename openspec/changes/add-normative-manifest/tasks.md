## 1. Validate and establish the contract

- [ ] 1.1 Create the proposal, design, tasks, and complete capability delta.
- [ ] 1.2 Validate this change strictly and validate the repository OpenSpec
  standard without running compiler or Cargo commands.
- [ ] 1.3 Add failing tests proving the manifest requires the four minimum
  chapters, deterministic JSON export per revision, and rejection of entries
  missing capability or source file references.

## 2. Introduce the manifest

- [ ] 2.1 Define the manifest chapter JSON document schema (chapter id, title,
  ordered entries with description, example, capability references, and source
  file references).
- [ ] 2.2 Author the Introduction, Syntax Index, Corelib and Runtime, and ISLE
  and Lowering chapter JSON documents with real capability and source file
  references.
- [ ] 2.3 Extend catalog generation to discover manifest chapter documents and
  expose them with their references and the current catalog revision.
- [ ] 2.4 Regenerate `openspec/catalog.json` after the chapter documents and
  catalog generator changes land.

## 3. Serve and render

- [ ] 3.1 Add a stable public route on the platform-spec site serving the
  rendered manifest in declared chapter order.
- [ ] 3.2 Add a JSON export endpoint returning a single deterministic document
  containing every chapter and entry in declared order.
- [ ] 3.3 Add a self-contained rendered export of the same content.
- [ ] 3.4 Add a link to the manifest from reader navigation.

## 4. Verify and promote deliberately

- [ ] 4.1 Add regression coverage for missing chapters, unresolved capability
  references, missing source file references, non-deterministic export, and
  stale-revision manifest.
- [ ] 4.2 Validate the canonical standard and this change, then archive it
  only after the implementation and tests are complete.
