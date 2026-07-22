## Why

Platform Spec content currently has a canonical requirements directory but no
first-class contract for taxonomy hubs, feature-owned articles, or decisions.
Readers, catalog consumers, and authenticated editors therefore cannot agree on
which path and authority applies to a document or which catalog revision a
draft was based on.

## What Changes

- Define the canonical paths and parent relationships for taxonomy hubs,
  features, articles, and decisions.
- Keep taxonomy hubs provisional and make feature specifications the normative
  authority for their owned document contexts.
- Require catalog metadata for document identity, authority, parent, source
  hash, and revisioned draft bases.
- Require server-side path, kind, parent, authority, and base-revision
  validation before a Platform Spec draft can become a pull request.

## Impact

- `openspec/catalog.json` records first-class Platform Spec document contexts.
- Catalog builders and standard validators reject unrecognized document kinds
  and inconsistent document ownership.
- Platform Spec draft and pull-request work can consume a stable authority and
  immutable base-revision contract.
