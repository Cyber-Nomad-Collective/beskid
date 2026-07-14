# standard-reader-embedding Specification

## Purpose
TBD - created by archiving change migrate-beskid-standard-to-openspec. Update Purpose after archive.
## Requirements
### Requirement: Platform-spec reads OpenSpec directly
The platform-spec application SHALL derive its catalog, navigation, rendered content, and edit targets from `openspec/specs` and SHALL NOT require the custom `spec.json`, `content.md`, `layout.json`, or `related.json` storage model.

#### Scenario: Platform-spec starts from a clean checkout
- **GIVEN** `openspec/specs` and `openspec/catalog.json` are present
- **WHEN** the platform-spec service builds and starts
- **THEN** canonical specifications and legacy aliases are available without importing website MDX or seeding the custom corpus

### Requirement: Standard embeds are framework neutral
The platform-spec service SHALL expose a versioned embed contract usable from Astro, React, static Markdown renderers, and plain HTML without requiring a shared framework runtime.

#### Scenario: A site embeds a requirement
- **GIVEN** a canonical capability and requirement identifier
- **WHEN** a consumer renders the standard embed
- **THEN** the embed shows title, status, normative text, canonical link, source revision, and an accessible fallback link

### Requirement: Markdown directives resolve typed entities
Supported Markdown renderers SHALL recognize typed `spec`, `book`, `nexus`, and `bug` directives, validate their targets, and emit accessible links or embeds while preserving readable source text in unsupported renderers.

#### Scenario: Renderer does not install the extension
- **GIVEN** a document contains a typed directive
- **WHEN** a generic Markdown renderer displays the source
- **THEN** the directive remains understandable as a normal fenced block or link

