## Context

OpenSpec is the sole normative source, while Platform Spec presents and edits
that source through reviewed pull requests. The repository needs a portable
identity for the content a reader or editor sees: taxonomy hubs organize the
space, a feature spec owns normative requirements, and documents add
informative context.

## Decisions

### Canonical document hierarchy

The hierarchy is explicit rather than inferred from a display URL:

- `openspec/specs/taxonomy--<domain>/spec.md` is a provisional domain hub.
- `openspec/specs/taxonomy--<domain>--<area>/spec.md` is a provisional area
  hub and names its domain hub parent.
- `openspec/specs/<domain>--<area>--<feature>/spec.md` is the normative feature
  specification and names its area hub parent.
- `openspec/documents/platform-spec/<feature>/articles/<slug>.md` is an
  informative article.
- `openspec/documents/platform-spec/<feature>/decisions/<number>-<slug>.md` is
  an informative decision record.

### Catalog and draft identity

Each Platform Spec document catalog record carries its canonical path, kind,
parent capability, authority, disposition, title, and source hash. A draft
carries the catalog revision it began from as its immutable `baseRevision`.
The server compares that value to the current catalog revision; it never
rewrites the submitted base revision or silently re-bases a draft.

### Validation boundary

Catalog generation discovers only the `articles` and `decisions` document
directories. Standard validation rejects unknown kinds, invalid canonical
paths, mismatched parents, and any non-informative feature document. Platform
Spec performs the same checks server-side before creating or updating a pull
request.

## Consequences

Catalog consumers can distinguish a feature requirement from its explanatory
material without parsing a URL. Existing taxonomy hubs retain their provisional
conformance status until an explicit feature requirement is accepted.
