## Why

Beskid's normative rules are spread across a 1,042-node custom content tree, Book pages, repository docs, application-specific catalogs, and GitHub-linked tracker metadata. The duplication makes authority, validation, traceability, embedding, and staged delivery inconsistent; OpenSpec provides one validated change and specification model that can become the sole standard source.

## What Changes

- **BREAKING** Replace `site/spec-content/platform-spec/**` as the normative storage format with `openspec/specs/<capability>/spec.md`; retain generated compatibility aliases for existing `/platform-spec/**` URLs.
- Convert every current domain, area, feature, article, and accepted decision into validated OpenSpec capability requirements and scenarios, with a generated provenance catalog.
- Classify repository and Book documentation as informative, move any unique normative clauses into OpenSpec, and make informative pages link to canonical requirements instead of restating them.
- Make the platform-spec site read OpenSpec directly and expose framework-neutral embeddable standard cards/blocks for the website, Tracker, Nexus, and other sites.
- Add structured Markdown directives for links among OpenSpec requirements, Book pages, implementation symbols, Tracker bugs, and Nexus graph views.
- Remove Tracker GitHub synchronization for roadmap tasks and non-bug work; retain GitHub integration only for public bug intake, bug status, and bug references.
- Extend Beskid Nexus indexing and link resolution so OpenSpec capabilities and requirements participate in code/document graphs and deep links.
- **BREAKING** Remove legacy and duplicated CI/CD pipelines, then introduce generic reusable GitHub Actions for validation, build, test, supply-chain checks, staged image promotion, deployment, rollback, and OpenTelemetry-compatible trace correlation.

## Capabilities

### New Capabilities

- `standard-content-authority`: Canonical OpenSpec storage, migrated requirements, provenance, authority rules, validation, and compatibility aliases for the Beskid standard.
- `standard-reader-embedding`: Direct OpenSpec rendering plus portable embeds and Markdown directives shared across Beskid sites.
- `standard-traceability`: Typed links among requirements, Book guidance, implementation/conformance anchors, Tracker bugs, and Nexus graph entities.
- `tracker-bug-integration`: Bug-only GitHub synchronization and removal of GitHub-backed roadmap/task behavior.
- `staged-delivery-observability`: Generic, reusable, traced GitHub Actions with explicit development, staging, and production promotion gates.

### Modified Capabilities

None. This repository did not contain OpenSpec capability files before this change.

## Impact

- Normative content: `site/spec-content/**`, `openspec/**`, and informative material under `site/website/src/content/docs/**`, root `docs/**`, READMEs, and subproject docs.
- Applications: `site/platform-spec`, `site/website`, `beskid_tracker`, `beskid_nexus`, and shared web packages where the existing dirty worktree permits safe edits.
- Interfaces: platform-spec catalogs and routes, spec link payloads, Markdown rendering, Tracker storage/sync APIs, Nexus indexing and deep links.
- Delivery: root and nested `.github/workflows/**`, reusable actions/scripts, `beskid_infra`, Compose/Coolify deployment definitions, release promotion, and telemetry metadata.
- Compatibility: stable public URLs are preserved through generated aliases; custom authoring/editor APIs and non-bug GitHub roadmap synchronization are removed.
