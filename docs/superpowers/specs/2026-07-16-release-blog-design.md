# Release Blog Design

## Goal

Publish a first-class Astro release blog that records Beskid delivery history
from v0.0 through v0.4, while keeping the July ISLE/native-runtime work
separate as an explicitly in-progress migration note.

## Authority and editorial rules

- The Platform Spec is the only normative source. Posts link to its stable
  URLs and never invent version-prefixed specification URLs.
- Tracker release records and Git history establish historical delivery facts.
  A release post does not convert a historical delivery label into a current
  behavioural guarantee.
- The Beskid Book supplies the informal, direct tone only. Blog posts remain a
  separate information surface and do not join Book navigation.
- v0.3 is described as a truncated delivery band. v0.4 is a progress report
  and remains explicitly in progress.
- The ISLE/native-runtime post is labelled "Approved design / in progress".
  It must not claim a full runtime, conformance, general HIR-to-CLIF migration,
  self-hosting, or a Rust-free toolchain.

## Information architecture

Add a typed `blog` Astro content collection and route it at `/blog/`.

- `/blog/` lists every post by date, title, release label, and status.
- `/blog/<slug>/` renders one post with the standard site chrome.
- Five release-history posts cover v0.0 through v0.4.
- One separate migration note explains the planned ISLE handler layer and
  target-specific native runtime kit boundary without assigning it to v0.4.
- The landing/header integration exposes one Blog link. It must not alter the
  Book's generated navigation tree.

## Post contract

Every post frontmatter record includes a title, description, publication date,
status, and optional release label. The body follows one repeatable structure:

1. a clear status callout;
2. what changed, backed by tracker/Git evidence;
3. what it does not claim or leaves unfinished;
4. links to the current Platform Spec for behaviour contracts; and
5. provenance links to tracker data or commit ranges.

Release posts use `released`, `truncated`, or `in-progress` status values.
The migration post uses `in-progress` and identifies its approved-design
source. Content must use direct, practical language, but preserve the above
status boundaries.

## Tracker-data backfill

Before authoring, compare each v0.0-v0.4 tracker record with its stated Git
cutoff and article. Correct only factual omissions or contradictions found in
that evidence. Existing tracker status remains authoritative unless new Git
and source evidence proves a correction. The blog consumes the verified
records rather than duplicating uncited release facts.

The verified backfill in this change is limited to four v0.4 provenance
corrections: the `tracker-kanban-dnd` completion date is 2026-06-04, the
`spine-typecheck-gates` completion date is 2026-06-07, and the
`platform-observability-pass` and `tracker-container-ci` source subjects must
match their Git subjects. Two unavailable submodule commits remain explicitly
unverified and are not rewritten.

## Verification

- Add content-schema/route tests that fail before the blog exists.
- Run the focused blog tests, then `bun run test:docs-links` and `bun run
  build` in `site/website`.
- Verify the built `/blog/` index and all six post routes are emitted.
- Update `CHANGELOG.md` under `Unreleased > Added` with the blog and tracker
  backfill scope.

## Non-goals

- RSS, search/filter UI, comments, and a visual redesign are out of scope.
- No Book navigation changes or generated Book-tree edits.
- No changes to compiler, OpenSpec requirements, or runtime implementation.
