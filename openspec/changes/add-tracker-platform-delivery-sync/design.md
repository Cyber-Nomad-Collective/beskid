## Context

OpenSpec is the normative specification authority. Tracker is the delivery
authority, while Platform Spec is a reader and authenticated editor that must
propose normative changes through pull requests. GitHub remains an external
bug tracker only.

## Decisions

### Revisioned Tracker specification links

Every Tracker-to-OpenSpec link carries a stable `standardId`, its
`catalogRevision`, and a relationship. Consumers use those values together, so
a rendered link cannot silently resolve against a newer catalog.

### Public delivery selection

Tracker versions carry status, visibility, and catalog revision. A version is
eligible for public latest delivery only when its status is `Released` and its
visibility is `public`.

### Typed link destinations

Links identify their target as a Tracker version, Tracker task, OpenSpec
requirement, or GitHub bug. Each target contains the identity fields necessary
to resolve it without parsing an untyped URL.

### Pull-request-backed Platform Spec editing

Platform Spec verifies the signed-in user's GitHub write access, creates or
reuses one deterministic edit batch and pull request, and rejects an edit based
on a stale catalog revision. It refreshes its catalog only after the pull
request is merged.

### Bug-only GitHub synchronization

GitHub synchronization creates and updates bug records and references only.
Tracker versions, tasks, workstreams, and their specification links are never
imported from or exported to GitHub.
