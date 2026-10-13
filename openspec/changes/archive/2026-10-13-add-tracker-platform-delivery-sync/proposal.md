## Why

Tracker delivery data, Platform Spec edits, and public release views need one
revisioned contract. Without it, a Tracker task can point at an unversioned
specification, public delivery views can expose unreleased work, and Platform
Spec can write normative content outside a reviewed pull request.

## What Changes

- Define revisioned OpenSpec links for Tracker work and typed targets shared by
  delivery, spec, task, and GitHub-bug views.
- Make Tracker the authority for delivery version status and public visibility.
- Require authenticated Platform Spec edits to be proposed through a pull
  request and tied to the source catalog revision.
- Keep GitHub synchronization limited to bugs; roadmap and delivery state stay
  in Tracker.

## Impact

- Tracker persistence and APIs gain catalog-revision-aware delivery and link
  fields.
- Platform Spec uses the contract when proposing edits and embedding Tracker
  tasks.
- Public consumers resolve only released, public Tracker delivery versions.
