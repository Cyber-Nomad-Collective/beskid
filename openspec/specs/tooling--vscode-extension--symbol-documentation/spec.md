<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# Symbol documentation Specification

## Purpose

Opening Beskid symbol documentation from VS Code and the language server.

## Requirements

### Requirement: Symbol documentation LSP command
The extension and LSP MUST resolve a documentation URL for a symbol at a cursor position and open it in the system browser. The LSP command `beskid.symbol.getDocumentationUri` SHALL accept `{ uri: string, offset: number }` and return `{ url?: string }`. When the symbol belongs to a locked registry dependency, the URL SHALL be `{registryBase}/docs/{package}@{version}` (fragment optional). When the symbol source is corelib or a builtin, the LSP SHALL return a site-relative `/platform-spec/...` path for the extension to join with `beskid.docs.specBaseUrl`. Otherwise the URL SHALL be `{bookBase}/book/?q={symbolName}` or `{bookBase}/book/`. The response SHALL be empty when no documentation target exists.

#### Scenario: Registry package docs URL
- **GIVEN** the cursor is on a symbol that belongs to a locked registry dependency package `demo` at version `1.2.3`
- **WHEN** the client invokes `beskid.symbol.getDocumentationUri`
- **THEN** the response `url` is `{registryBase}/docs/demo@1.2.3` (optional fragment permitted)

#### Scenario: Unknown symbol falls back to book
- **GIVEN** a resolved symbol that is neither a locked registry dependency nor corelib/builtin with a dedicated path
- **WHEN** documentation URI resolution runs
- **THEN** the URL uses `{bookBase}/book/?q={symbolName}` or `{bookBase}/book/`

### Requirement: Extension openSymbolDocumentation command
`beskid.openSymbolDocumentation` MUST use the active editor URI and selection offset, call the LSP documentation command, and invoke `vscode.env.openExternal` when a URL is returned. The editor context menu SHOULD expose this command for `beskid` and `beskid-proj` resources. Hover SHOULD append `[View documentation](url)` when `url` is present.

#### Scenario: Open documentation in system browser
- **GIVEN** an active Beskid editor with a symbol that resolves to a documentation URL
- **WHEN** the user runs `beskid.openSymbolDocumentation`
- **THEN** the extension calls the LSP command and opens the returned URL via `vscode.env.openExternal`

## Informative Source Provenance

The records below preserve migration history and are not normative except where text was extracted into a requirement above.

### Source Record: Symbol documentation

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/vscode-extension/symbol-documentation/`  
**Source:** `site/spec-content/platform-spec/tooling/vscode-extension/symbol-documentation/content.md`  
**SHA-256:** `cd2f2948949668dbbba93346860fc16610bc2512eada68055bec5202b5fd62a6`

<details>
<summary>Migrated source text</summary>

``````markdown
<SpecSection title="What this feature specifies" id="what-this-feature-specifies">
The extension and LSP **must** resolve a documentation URL for a symbol at a cursor position and open it in the system browser. Registry packages link to pckg docs; unknown symbols fall back to the Beskid book.
</SpecSection>

<SpecSection title="LSP executeCommand" id="lsp-executecommand">
| Command | Arguments | Response |
| --- | --- | --- |
| `beskid.symbol.getDocumentationUri` | `{ uri: string, offset: number }` | `{ url?: string }` |

Resolution rules:

1. When the symbol belongs to a locked registry dependency, `{registryBase}/docs/{package}@{version}` (fragment optional for symbol anchor).
2. When the symbol source is corelib or a builtin, return a site-relative `/platform-spec/...` path (extension joins with `beskid.docs.specBaseUrl`).
3. Otherwise `{bookBase}/book/?q={symbolName}` or `{bookBase}/book/`.
4. Empty response when no documentation target exists.

Hover **should** append `[View documentation](url)` when `url` is present (modifier-click opens in browser).
</SpecSection>

<SpecSection title="Extension commands" id="extension-commands">
| Command | Rule |
| --- | --- |
| `beskid.openSymbolDocumentation` | Uses active editor URI + selection offset; calls LSP command; `vscode.env.openExternal` when URL returned |

Editor context menu **should** expose this command for `beskid` and `beskid-proj` resources.
</SpecSection>

## Decisions
<!-- spec:generate:adr-index -->
No ADRs published under **`adr/`** yet.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Design model](./articles/design-model/)
<!-- /spec:generate:article-index -->
``````

</details>

### Source Record: Design model

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/vscode-extension/symbol-documentation/articles/design-model/`  
**Source:** `site/spec-content/platform-spec/tooling/vscode-extension/symbol-documentation/articles/design-model/content.md`  
**SHA-256:** `b95fbb0dc8ec4b53620ac8f2b2cbf3c4baa5ec69d4fef85a33f22d0961dc3d19`

<details>
<summary>Migrated source text</summary>

``````markdown
## URI resolution

| Source | URL pattern |
| --- | --- |
| Registry package symbol | `{pckgBase}/docs/{packageName}@{resolvedVersion}` |
| Corelib / builtin workspace source | `{siteRoot}/platform-spec/core-library/...` or `/platform-spec/language-meta/interop/builtins-and-symbols/` |
| Other symbols | `{bookBase}/book/?q={symbolName}` or `{bookBase}/book/` |

The LSP returns site-relative `/platform-spec/...` paths for corelib and builtin symbols. The extension joins them with `beskid.docs.specBaseUrl` (or the site root derived from it) before `vscode.env.openExternal`.

Implementation: `beskid_lsp` executeCommand handler; extension `beskid.openSymbolDocumentation` and `resolveDocumentationUrl`.

## Hover integration

When `beskid.symbol.getDocumentationUri` returns a URL for the hover offset, append a markdown link to hover content. VS Code opens `https:` links from hover on modifier-click.

## Settings

| Setting | Default | Role |
| --- | --- | --- |
| `beskid.pckg.baseUrl` | `https://pckg.beskid-lang.org` | Registry docs base |
| `beskid.docs.bookBaseUrl` | `https://beskid-lang.org` | Book fallback base |
| `beskid.docs.specBaseUrl` | `https://beskid-lang.org/platform-spec` | Platform-spec base for `/platform-spec/...` paths from the LSP |

The extension forwards `BESKID_PCKG_BASE_URL`, `BESKID_BOOK_BASE_URL`, and `BESKID_SPEC_BASE_URL` to the LSP child process so server-side URI resolution matches workspace settings.
``````

</details>
