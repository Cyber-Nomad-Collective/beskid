## Context

The current standard is a custom tree with 1,042 Markdown nodes (1 root, 7 domains, 38 areas, 134 features, 565 articles, and 297 ADRs). It is consumed through custom manifests, layouts, generated catalogs, website artifacts, Tracker link payloads, and a Nexus MDX scanner. Only 71 source files contain normative modal language and 669 contain fewer than 200 words, so a mechanical format-only conversion would create syntactically valid but substantively weak specifications.

The Book has 192 overlapping Markdown/MDX pages and must remain useful without becoming a second authority. Tracker contains two GitHub sync stacks; removing non-bug sync has a high blast radius. Delivery currently has critical ordering and artifact-identity defects: smoke failures do not block production, release artifacts are not the deployed artifacts, and some production failures are suppressed.

Constraints include existing stable `/platform-spec/**` links, user changes already present in the worktree, uncommitted deletion of shared UI package trees, an installed OpenSpec 1.4.1 CLI, Bun-based sites, nested Git repositories/submodules, Coolify deployment, and GitHub Actions orchestration.

## Goals / Non-Goals

**Goals:**

- Establish `openspec/specs` as the sole normative Beskid standard.
- Preserve every legacy node's text, path, decision identifiers, and provenance while incrementally improving requirement quality.
- Provide stable aliases and a versioned catalog for all consumers.
- Use a framework-neutral embed/directive protocol across the platform-spec site, Book, Tracker, and Nexus.
- Reduce Tracker GitHub integration to bugs without losing historical links.
- Make Nexus a useful authority-aware graph joining standard, docs, code, tests, and bugs.
- Replace unsafe CI/CD with build-once digest promotion, staging, production gates, rollback, supply-chain evidence, and trace correlation.

**Non-Goals:**

- Rewriting all 1,042 legacy texts into ideal prose in a single pass.
- Treating archived ADR rationale, Book tutorials, generated API docs, or source comments as normative.
- Restoring the currently deleted shared UI packages.
- Changing the Beskid language solely to accommodate the documentation migration.
- Deploying to production from this working tree or changing external secrets without a reviewed environment rollout.

## Decisions

### 1. Feature-centered capability model

Each of the 134 feature hubs becomes one OpenSpec capability named `<domain>--<area>--<feature>`. Its feature text, articles, and accepted ADR obligations become named requirements; domain and area hubs become generated taxonomy unless they contain genuine cross-feature guarantees. This keeps capabilities reviewable while preserving the existing conceptual map.

Alternatives rejected: one capability per legacy node creates over 1,000 tiny specs; one capability per domain creates unreviewable monoliths; retaining the custom hierarchy keeps two authoring models.

### 2. Two-pass semantic migration

Pass A creates complete provenance, aliases, taxonomy, and structurally valid preservation requirements. It flags low-density and mechanically wrapped requirements. Pass B promotes real normative clauses into precise named requirements/scenarios and fails quality gates for unresolved placeholders. Unique normative Book/repository claims enter the same review queue; informative prose stays outside canonical specs.

This staged approach is chosen over a destructive big-bang rewrite because only a small fraction of the corpus currently states explicit obligations.

### 3. Catalog is compatibility metadata, not authority

`openspec/catalog.json` maps stable IDs, capability paths, requirement anchors, legacy slugs, source hashes, statuses, aliases, and relations. It is deterministically generated from specs plus migration provenance. Consumers may cache it by revision, but normative text is always read from `openspec/specs`.

### 4. Framework-neutral embedding

The platform-spec service exposes versioned JSON and HTML endpoints plus a small standards-based custom element. Markdown uses readable fenced directives such as `spec`, `book`, `nexus`, and `bug`; renderers enhance them when supported and leave understandable fallback text otherwise. This avoids coupling Astro, React, and Nexus to a deleted shared package.

### 5. Adapters before deletion

Platform-spec, Tracker, and Nexus first receive OpenSpec catalog adapters. Legacy readers stay only behind explicit compatibility boundaries until tests prove equivalent resolution. Tracker task sync is frozen before bug-only extraction, and historical task links become read-only before schemas/services are deleted.

### 6. Immutable staged delivery

Reusable GitHub workflows perform quality/security checks, build once by commit SHA, publish signed digest manifests with SBOM/provenance, deploy automatically to a distinct staging environment, and promote the same manifest through a protected production environment. Deploy APIs fail closed, poll to terminal state, execute smoke/SLO gates, and roll back to the previous healthy manifest.

Every stage carries `traceparent`, a stable deployment correlation ID, commit SHA, OpenSpec revision, manifest digest, and GitHub run URL into deployment metadata and service telemetry.

### 7. Legacy deletion criteria

A legacy path is deleted only when its replacement passes strict OpenSpec validation, provenance coverage is 100%, public aliases resolve, affected consumer tests pass, change detection matches expected flows, and a rollback artifact exists. Generated/cached content is never committed as a second authority.

## Risks / Trade-offs

- **Semantic loss in mechanical conversion** -> retain source hashes/text, flag generated wrappers, and require capability-by-capability semantic review.
- **Temporary split authority** -> freeze writes to the custom corpus once OpenSpec adapters land and display a generated compatibility notice.
- **Broken external links** -> generate and test aliases for every legacy slug before removing files.
- **Lost ADR rationale** -> archive complete ADR bodies as design history while extracting only active obligations into current specs.
- **Tracker webhook regressions** -> use feature flags and bug-only contract tests before deleting task handlers.
- **Nexus stale graph data** -> include catalog hash in cache identity and rebuild on revision mismatch.
- **CI migration blocks releases** -> introduce replacement workflows disabled for deployment first, run in shadow mode, then switch required checks/environments.
- **Supply-chain tooling increases latency** -> build artifacts once and parallelize independent scans/evidence generation.
- **Nested repositories complicate atomic changes** -> keep directory ownership disjoint and report every nested repository diff explicitly.

## Migration Plan

1. Pin OpenSpec CLI compatibility, validate change artifacts, generate the baseline capability catalog, and audit coverage without deleting source content.
2. Add direct OpenSpec readers, compatibility aliases, embed endpoints, and typed directive parsing; switch Book/Tracker/Nexus consumers.
3. Freeze non-bug task sync, migrate consumers to bug-only APIs, preserve historical links, then remove legacy sync and storage.
4. Add immutable CI build/evidence workflows, automatic staging, protected production promotion, fail-closed deploy polling, smoke/SLO gates, and rollback; run in shadow mode against existing delivery.
5. Make new checks required, switch deployment authority, then delete obsolete Dagger/OpenTofu/nested/duplicate workflows and mutable-tag deployment paths.
6. After 100% provenance and alias coverage plus consumer verification, remove the custom normative content tree and custom writer/importer APIs; archive the OpenSpec change.

Rollback keeps the legacy content tree read-only and retains the previous healthy deployment manifest until each cutover gate passes. Consumer adapters can be switched back to the legacy catalog during the compatibility window without reverting migrated specs.

## Open Questions

- Which protected GitHub environments and human approvers should own production promotion?
- Which registry/signing stack is preferred for enforcement: GitHub artifact attestations plus Cosign keyless signing, or another organization-standard verifier?
- What retention period is required for historical Tracker task links and legacy URL aliases?
- Should accepted ADR histories live under archived OpenSpec changes only, or also in a generated non-normative design-history view?

