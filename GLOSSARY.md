# Glossary

## Beskid standard

The current normative requirements in `openspec/specs`. A text outside that directory is not part of the standard unless it is incorporated through a validated OpenSpec change.

## Bug-only GitHub synchronization

Tracker integration in which GitHub Issues represents public bugs and their supported status/discussion fields only. Roadmap tasks, versions, workstreams, milestones, and deliverables remain in Tracker's SQLite domain model.

## Capability

An OpenSpec unit stored at `openspec/specs/<capability>/spec.md`. During migration, Beskid feature hubs become feature capabilities while domains and areas become taxonomy/governance capabilities.

## Informative documentation

Book pages, READMEs, guides, generated API documentation, archived designs, and implementation comments that explain or provide evidence for the standard but cannot redefine normative behavior.

## Legacy alias

A stable `/platform-spec/**` path mapped through `openspec/catalog.json` to a canonical capability or requirement, preserving existing Book, Tracker, Nexus, and external links.

## Normative requirement

A named OpenSpec requirement using SHALL or MUST and one or more testable scenarios. It defines behavior required for Beskid conformance.

## Platform specification

The public reader and service that renders the Beskid standard. It is a presentation and integration surface; `openspec/specs` is its source of authority.

## Provenance catalog

The deterministic `openspec/catalog.json` mapping stable capability/requirement identifiers to source hashes, legacy slugs, canonical paths, statuses, aliases, and informative document references.

## Provisional capability

An OpenSpec capability retained for discoverability and historical coverage when its migrated material contained no explicit normative claim. Its single provisional requirement says that the capability cannot be cited for conformance until a reviewed OpenSpec change adds testable requirements.

## Source provenance

Informative text and hashes retained inside OpenSpec capabilities and `openspec/catalog.json` to explain where migrated requirements came from. Provenance preserves history but is not itself normative.

## Semantic review

The process of turning preserved descriptive migration text into precise, independently testable OpenSpec requirements without inventing behavior or losing source rationale.

## Staged promotion

A delivery process that builds an artifact once, verifies and deploys its immutable digest to staging, then promotes the exact same digest to a protected production environment with smoke/SLO gates and rollback evidence.

## Typed Markdown directive

A readable Markdown block or link that identifies a `spec`, `book`, `nexus`, or `bug` target and can be enhanced into an embed by supported renderers while remaining understandable in generic Markdown.
