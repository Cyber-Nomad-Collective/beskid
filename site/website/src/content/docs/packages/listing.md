---
title: Package Listing
description: Catalog and discovery model for package consumers and maintainers.
---

## What every package card should show

- Package id and current stable version.
- Maintainer/owner label.
- Download trend (7d/30d).
- Risk flags (unlisted, deprecated, security advisory).
- Verification signals (signed, verified owner, provenance available).

## Metadata model

The listing view should ingest package metadata from a registration index (`index.json`) and page leafs for larger packages. This follows NuGet's pattern of inlining small version sets and paging high-cardinality histories.

## UX behavior

- Instant search by package id and owner.
- Filter by status: `published`, `pending`, `needs-changes`, `deprecated`.
- Sort by downloads, recent updates, and trust level.
- Keep package detail links stable for deep-linking in review tickets.
