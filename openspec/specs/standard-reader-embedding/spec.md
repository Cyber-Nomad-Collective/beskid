# standard-reader-embedding Specification

## Purpose
This specification defines how platform-spec reads OpenSpec as the sole corpus. It exposes framework-neutral standard embeds and typed Markdown directives for Book and site consumers.
## Requirements
### Requirement: Platform-spec reads OpenSpec directly
The platform-spec application SHALL derive its catalog, navigation, rendered content, and edit targets from `openspec/specs`. The application SHALL NOT require the custom `spec.json`, `content.md`, `layout.json`, or `related.json` storage model.

#### Scenario: Platform-spec starts from a clean checkout
- **GIVEN** `openspec/specs` and `openspec/catalog.json` are present
- **WHEN** the platform-spec service builds and starts
- **THEN** canonical specifications and legacy aliases are available without importing website MDX or seeding the custom corpus

### Requirement: Standard embeds are framework neutral
The platform-spec service SHALL expose a versioned embed contract. The contract is usable from Astro, React, static Markdown renderers, and plain HTML. The contract does not require a shared framework runtime.

#### Scenario: A site embeds a requirement
- **GIVEN** a canonical capability and requirement identifier
- **WHEN** a consumer renders the standard embed
- **THEN** the embed shows title, status, normative text, canonical link, source revision, and an accessible fallback link

### Requirement: Markdown directives resolve typed entities
Supported Markdown renderers SHALL recognize typed `spec`, `book`, `nexus`, and `bug` directives. The renderers SHALL validate the targets. The renderers SHALL emit accessible links or embeds. The source text stays readable in unsupported renderers.

#### Scenario: Renderer does not install the extension
- **GIVEN** a document contains a typed directive
- **WHEN** a generic Markdown renderer displays the source
- **THEN** the directive remains understandable as a normal fenced block or link

