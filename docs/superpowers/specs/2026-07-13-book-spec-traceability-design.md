# Book and Standard Traceability Design

## Goal

Make the Beskid Book easier to use without weakening the authority of
`openspec/specs`: technical guidance must point readers to the governing
standard, and the standard catalog must expose the corresponding Book guides.

## Authority boundary

OpenSpec remains the sole normative source. Book pages remain informative,
explain concepts and procedures in their own words, and use canonical
`/platform-spec/` routes or typed `spec` directives for normative references.
The catalog records the reciprocal, informative Book relationship; it does not
make Book prose normative.

## Components

### Coverage validator

Add a deterministic validation step that reads `openspec/catalog.json` and the
Book source tree. It verifies that technical Book pages have at least one
resolvable canonical standard link, permits explicitly declared narrative
exceptions, and reports the Book pages associated with every capability.
It is part of the OpenSpec validation command, so link drift is caught before
publication.

### Catalog relationships

When rebuilding the catalog, derive a `bookLinks` collection on each capability
from the existing informative-document `standardLinks` records. The value is
generated, sorted, and contains only Book paths that resolve to that capability.
It supplies a single data model for the standard reader and validation rather
than maintaining a second hand-written map.

### Book pilot corpus

Expand the thin technical pages in chapters 13, 20, and 21. Each page uses the
existing Starlight `Aside` component only where it clarifies authority,
prerequisites, compatibility pitfalls, or the next learning step. Every
behavioral explanation links to a canonical standard page and to its Book hub.

## Verification

Tests first cover catalog-derived reciprocal links and coverage failures. The
OpenSpec validator rebuilds and validates the catalog; the website directive
tests and Astro build verify rendering and all MDX imports.

## Non-goals

This change does not manufacture prose for every existing page, alter
normative requirements, or make narrative chapters carry artificial standard
links. The validator provides an explicit exception mechanism for those pages.
