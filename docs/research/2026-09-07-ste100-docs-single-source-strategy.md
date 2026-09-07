# Research: ASD-STE100 and a single Beskid Docs source

**Date:** 2026-09-07
**Scope:** Establish a safe documentation strategy for a public `beskid-lang.org/docs` area, STE-governed technical prose, and retirement of the separate Platform Spec application.
**Status:** Research only. No product documentation changed.

## Evidence

- [ASD-STE100 Issue 9](https://www.asd-ste100.org/assets/files/ASD-STE100_ISSUE9.pdf), published 2025-01-15, is the current official standard. It defines STE with writing rules and a controlled dictionary.
- ASD states that STE is applicable outside its aerospace origin and permits project-specific technical names and verbs when they follow the standard's rules. [ASD overview](https://www.asd-ste100.org/about.html)
- ASD warns that AI can produce prose that looks compliant without verified compliance. Human review, quality assurance, and the current official standard remain necessary. [ASD downloads and AI guidance](https://www.asd-ste100.org/STE_downloads.html)
- GitHub's documentation workflow stores source content in a documentation repository, uses Markdown-compatible source files and reusable content, and reviews changes through the normal repository workflow. [GitHub Docs authoring](https://docs.github.com/en/contributing/writing-for-github-docs/using-markdown-and-liquid-in-github-docs) and [contribution model](https://docs.github.com/en/contributing/collaborating-on-github-docs/about-contributing-to-github-docs)

## Current topology (observed)

| Surface | Current role | Evidence | Migration implication |
| --- | --- | --- | --- |
| `openspec/specs/` | Normative requirements | `openspec/config.yaml` names it the canonical normative standard. | Preserve as the only normative content source. |
| `site/platform-spec/` | Separate OpenSpec reader, editor, and API application | `site/platform-spec/package.json` and `site/platform-spec/README.md`. | Retire the application only after its required public routes have a replacement. |
| `site/website/src/content/docs/` | Public Astro/Starlight docs, Book, and blog | `site/website/astro.config.mjs` and content tree. | Make this site the one public docs delivery surface. |
| `docs/`, component READMEs, and submodule `docs/` | Internal research, plans, operations, and local guidance | Repository inventory. | Classify each item; do not expose or duplicate it by default. |

The present setup has 198 normative OpenSpec documents, 231 website content documents, and a separate Platform Spec application with a generated/static content surface. It also contains at least 465 source references to `platform-spec`, `spec.beskid-lang.org`, or `/platform-spec`. A direct removal will therefore break links and changes authority semantics.

## Recommendations

1. Define authority by content type, not by rendering application:
   - **OpenSpec:** normative observable behavior and requirements.
   - **Beskid Docs (`/docs`):** STE-governed technical guidance, installation, operations, API/CLI reference, and architecture explanations.
   - **Book (`/book`):** narrative learning material that links to Docs or OpenSpec instead of duplicating them.
   - **Blog (`/blog`):** dated project news; never authoritative.
2. Use one checked-in public documentation source under `site/website/src/content/docs/` (for example, a top-level `docs/` collection), deployed by the existing Astro/Starlight site at `beskid-lang.org/docs`. Reuse one include/partial mechanism for repeated fragments. Do not copy a fact between a guide, Book, and blog post.
3. Keep OpenSpec source in `openspec/specs/`, but replace the Platform Spec application with a static website-rendered OpenSpec view or a stable `/spec` route that links to the canonical repository. This retains public access to the normative standard without a second documentation application.
4. Give every public document explicit metadata: `status`, `canonical`, `owner`, `lastVerified`, and, during migration, `replacedBy`. Add CI checks for duplicate canonical identifiers, broken links, and unsupported old Platform Spec URLs.
5. Migrate by inventory and content class: map each old Platform Spec route to `docs`, `book`, `blog`, `/spec`, or a deliberate `410`; publish redirects first; verify links and parity; then delete the old rendered content and deployment lane. Keep only a brief decommission page during the redirect window.
6. Treat an internal STE skill as authoring assistance, not proof of compliance. Pin it to ASD-STE100 Issue 9, maintain one Beskid technical-term glossary, exempt code and identifiers from vocabulary checks, and require human/maintainer review for each new or changed technical page.

## Risks to resolve before implementation

- `openspec/config.yaml`, `README.md`, and `GUIDE.md` currently publish the standard through `/platform-spec/` and `spec.beskid-lang.org`. The migration must change that contract and preserve stable redirects.
- Some Book content and architecture data link directly to `/platform-spec/`; route migration must include generated Book navigation and link-validation fixtures.
- "Clankers" is not established in the inspected documentation as a product or operating-model term. Define it in the project glossary before using it as an organizational claim in a public post.

## Decision

Use ASD-STE100 as the writing and review standard, not as a replacement for technical authority. Keep one source for each kind of truth: OpenSpec for normative rules and the website source tree for public technical guidance. Deliver both through the main Beskid domain, with the Book and blog as linked, non-duplicating surfaces.
