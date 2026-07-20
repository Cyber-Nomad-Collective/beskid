## ADDED Requirements

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

## REMOVED Requirements

### Requirement: Symbol documentation conformance status
**Reason**: Replaced by explicit behavioral requirements extracted from migrated source.
**Migration**: Cite the ADDED requirements above.
