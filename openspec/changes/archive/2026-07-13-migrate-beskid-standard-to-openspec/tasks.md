## 1. Stabilize and inventory

- [x] 1.1 Inventory custom standard nodes, Book/docs overlap, application consumers, GitHub sync stacks, Nexus indexing, and all CI/CD paths.
- [x] 1.2 Research OpenSpec format with Context7 and initialize the repo-local OpenSpec workflow.
- [x] 1.3 Record high/critical blast-radius findings and preserve unrelated worktree changes.
- [x] 1.4 Pin the OpenSpec CLI version used locally and in CI, then validate all change artifacts strictly.

## 2. Establish canonical standard content

- [x] 2.1 Implement deterministic migration tooling from feature/article/ADR nodes to OpenSpec capabilities and a provenance catalog.
- [x] 2.2 Generate the 134 feature capability specs plus cross-feature governance/taxonomy specs.
- [x] 2.3 Extract unique normative claims from Book, repository docs, compiler/corelib/BSOL/package/service docs into reviewed requirements.
- [x] 2.4 Add semantic-quality gates for placeholders, normative density, scenarios, source hashes, duplicate rules, and 100% legacy-node coverage.
- [x] 2.5 Generate and test legacy slug aliases before freezing the custom corpus.

## 3. Migrate readers and embeds

- [x] 3.1 Add a direct OpenSpec catalog/content adapter to platform-spec and remove website-MDX/custom-workspace fallback paths.
- [x] 3.2 Add versioned JSON/HTML embed endpoints and a dependency-free custom element with accessible fallback links.
- [x] 3.3 Define and implement typed `spec`, `book`, `nexus`, and `bug` Markdown directives.
- [x] 3.4 Replace Book normative duplicates with embeds/links and label remaining prose informative.

## 4. Integrate Tracker and Nexus

- [x] 4.1 Switch Tracker's spec picker and stored relations from the generated nav tree/custom fence to stable OpenSpec catalog identifiers.
- [x] 4.2 Freeze new task/non-bug GitHub import/export behind a migration flag and add regression tests.
- [x] 4.3 Route bug intake/status exclusively through the bug domain pipeline; migrate issue-number consumers and historical links.
- [x] 4.4 Remove legacy board/task sync UI, services, scripts, settings, webhooks, tables, and schemas after migration verification.
- [x] 4.5 Replace Nexus's legacy MDX scanner with a revisioned OpenSpec catalog index and cache invalidation.
- [x] 4.6 Render typed links/embeds in Nexus documentation panels and expose authority-aware standard/book/code/test/bug relations.

## 5. Replace CI/CD

- [x] 5.1 Introduce reusable changed-component quality, conformance, OpenSpec, integration, Compose, and security workflows with blocking reports.
- [x] 5.2 Build images once by SHA, publish digest manifests, SBOMs, provenance, signatures, and vulnerability results without persisting package tokens.
- [x] 5.3 Implement automatic distinct staging deployment with fail-closed Coolify polling, smoke/SLO checks, GitHub deployment status, and trace correlation.
- [x] 5.4 Implement protected production promotion of the exact staging digests with secret audit, approval, post-deploy gates, and rollback.
- [x] 5.5 Validate the replacement through local contract gates, make it the repository deployment authority, then remove Dagger/OpenTofu/dead nested/duplicate workflows and mutable-tag paths.

## 6. Verify and close

- [x] 6.1 Run affected unit, type, build, integration, conformance, OpenSpec, link, and deployment-contract tests.
- [x] 6.2 Run GitNexus change detection against `main` and confirm only expected symbols/processes changed.
- [x] 6.3 Update `GUIDE.md`, `GLOSSARY.md`, and `CHANGELOG.md`; run the agent-artifact safety hook.
- [x] 6.4 Remove the read-only custom corpus only after provenance, aliases, consumers, and rollback evidence pass; archive the OpenSpec change.
