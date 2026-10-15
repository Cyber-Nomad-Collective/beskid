## Why

The registry linked every public package to its own NodeBB *category*
(subforum). The owner wants a lighter, conventional shape: one discussion
*thread* (NodeBB topic) per package in a single "Packages" category, where the
registry also announces every release as a reply. Nothing was configured in
production against the category design and Beskid has no external users, so
the category link is replaced outright rather than kept beside the thread.

## What Changes

- **MODIFY** the "Registry-owned NodeBB discussion category" requirement into
  a per-package discussion thread: `POST /api/v3/topics` in the configured
  category (`PCKG_NODEBB_PACKAGES_CID` replaces
  `PCKG_NODEBB_PACKAGES_PARENT_CID`), persisted as topic id + slug (migration
  `0013` replaces the category columns), exposed as `community.{url, topicId,
  topicSlug}`, live `replyCount` / `viewCount` from `GET /api/topic/{tid}`.
- **ADD** a release reply: every successful version publish of a linked public
  package posts a reply to the thread with links to that version's files and
  documentation pages; a NodeBB failure never fails the publish.
- Keep: all-or-nothing configuration, no failure of package creation on
  NodeBB errors, `community_sync_failed` activity, idempotent administrator
  reconcile, no client-side URL derivation.

## Impact

- `compiler/crates/beskid_pckg_server` (`community.rs`, catalog, publish
  path), `beskid_pckg_store` (migration `0013`), `beskid_pckg_contract`.
- `beskid_sites/apps/pckg` community link ("Discuss on the forum").
- Compatibility: `community.categoryId/categorySlug` and
  `topicCount/postCount` are removed from the API; no migration guide, no
  compatibility path. Reverting restores the category requirement text.
- Legacy URL migration: none. Public standard routes are unchanged.
