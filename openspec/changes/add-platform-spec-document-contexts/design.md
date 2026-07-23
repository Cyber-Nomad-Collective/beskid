## Context

OpenSpec is the sole normative source. Platform Spec renders that source and,
once implemented, will edit it only through reviewed pull requests. The
repository needs a proposed portable identity for content a reader or editor
sees: taxonomy hubs organize the space, feature specifications own normative
requirements, and documents add informative context.

## Decisions

### Proposed canonical document hierarchy

- `openspec/specs/taxonomy--<domain>/spec.md` is a provisional domain hub.
- `openspec/specs/taxonomy--<domain>--<area>/spec.md` is a provisional area hub
  whose parent is the domain hub.
- `openspec/specs/<domain>--<area>--<feature>/spec.md` is a normative feature
  specification whose parent is the area hub.
- `openspec/documents/platform-spec/<feature>/articles/<slug>.md` is an
  informative article.
- `openspec/documents/platform-spec/<feature>/decisions/<number>-<slug>.md` is
  an informative decision record.

### Proposed catalog and draft identity

Each context will carry its canonical path, kind, parent capability, authority,
disposition, title, and source hash in the catalog. A draft will carry the
catalog revision it began from as immutable `baseRevision`; the server will
compare it with the current catalog revision and reject stale submissions
without rewriting or silently rebasing the submitted value.

### Validation boundary

The future catalog generator will discover and validate all four context kinds.
The future Platform Spec server will enforce the same path, kind, parent,
authority, and base-revision checks before it creates or updates a pull
request. No parser or other feature fixture is introduced by this proposal.

## Consequences

The proposed contract distinguishes a feature requirement from explanatory
material without inferring authority from a URL. Existing taxonomy hubs remain
provisional until explicit feature requirements are accepted.
