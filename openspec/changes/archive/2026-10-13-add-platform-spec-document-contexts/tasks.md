## 1. Model the document-context contract

- [ ] 1.1 Define typed catalog identities for domain taxonomy, area taxonomy,
  feature specifications, articles, and decisions.
- [ ] 1.2 Implement canonical-path, parent, authority, and disposition
  validation without synthesizing capabilities or documents.

## 2. Make draft revisions enforceable

- [ ] 2.1 Persist immutable catalog `baseRevision` when a Platform Spec draft is
  created.
- [ ] 2.2 Reject stale draft submissions server-side without rebasing or
  overwriting their submitted `baseRevision`.

## 3. Verify and promote deliberately

- [ ] 3.1 Add regression coverage for malformed paths, unknown kinds, parent
  mismatches, non-informative documents, and stale revisions.
- [ ] 3.2 Validate the canonical standard and this change, then archive it only
  after the implementation and tests are complete.
