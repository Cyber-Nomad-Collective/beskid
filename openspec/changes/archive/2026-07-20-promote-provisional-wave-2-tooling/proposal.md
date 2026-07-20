## Why

Nine tooling feature capabilities remain provisional stubs after wave 1.
Their Migrated source text already states uppercase BCP-14 obligations and
testable contracts. Leaving them provisional blocks Book and Tracker from
citing implemented tooling guarantees (Linear CYB-53 Cursor wave C).

## What Changes

- Promote nine tooling feature-level provisional capabilities to explicit
  SHALL/MUST requirements extracted from each capability's Migrated source.
- Remove each capability's single "SHALL remain non-conformant" requirement.
- Keep Purpose and Informative Source Provenance blocks unchanged.
- Skip design-model and decisions-record stubs (out of scope for this wave).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `tooling--auth-hub--contracts-and-edge-cases`: AUTH_HUB env contract, handoff JWT, pairing edge cases
- `tooling--foreign-library-import--cli-import-lib-command`: `beskid import lib` CLI contract
- `tooling--foreign-library-import--external-library-trait`: ExternalLibrary provider trait
- `tooling--formatter--verification-and-traceability`: formatter verification gates and idempotency
- `tooling--graph-visualization--contracts-and-edge-cases`: `beskid.getGraph` / CLI / Graph Explorer
- `tooling--lsp--diagnostics-and-workspace-analysis`: diagnostic tiers and workspace analysis
- `tooling--lsp--intellisense-capabilities-and-behavior`: IntelliSense feature surface
- `tooling--nexus--contracts-and-edge-cases`: Nexus REST, CodeDoc, MCP Bearer
- `tooling--vscode-extension--symbol-documentation`: symbol documentation URI resolution

## Impact

- Catalog `provisionalCapabilities` decreases by nine once catalog regenerates.
- Book and Tracker may cite the promoted requirements after archive.
- No implementation code changes; requirements reflect migrated obligations only.
- Rollback: restore provisional stub requirements from git history if needed.
