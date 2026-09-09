import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Extension UX.

## Decision

Graph data via LSP executeCommand only — **superseded in part** by [Graph visualization ADR D-TOOL-GRAPH-0001](/platform-spec/tooling/graph-visualization/adr/0001-mermaid-single-format/).

LSP **must** remain the authority for graph content. Payloads **may** include Mermaid strings and revision fingerprints from `beskid.getGraph`. The extension **must not** rebuild domain graphs locally.

## Consequences

beskid_vscode runtime; Graph Explorer panel renders LSP-supplied Mermaid.

## Verification anchors

package.json; runtime tests.
