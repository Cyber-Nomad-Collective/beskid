## Why

Platform Spec content has a canonical requirements directory but no accepted
first-class contract for taxonomy hubs, feature-owned articles, or decisions.
Readers, catalog consumers, and authenticated editors therefore cannot yet
agree on a document's path, authority, parent, or the catalog revision from
which a draft began.

## What Changes

- Propose canonical paths and parent relationships for taxonomy hubs, features,
  articles, and decisions.
- Keep taxonomy hubs provisional and reserve feature specifications for
  normative requirements.
- Propose catalog identity fields for every context and immutable draft
  `baseRevision` handling.
- Specify future catalog and server-side validation for kinds, paths, parents,
  authority, and stale draft revisions.

## Impact

- A future implementation will extend catalog generation and validation to
  represent taxonomy, feature, article, and decision identities.
- A future Platform Spec editor/server implementation will validate the same
  contract before creating or updating a pull request.
- Until those tasks are implemented and this change is accepted, the canonical
  OpenSpec standard and catalog remain unchanged.
