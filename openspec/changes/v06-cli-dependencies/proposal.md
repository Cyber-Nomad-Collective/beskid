# CLI and dependency workflows for beskid 0.6

## Why

The published 0.5.2 CLI mixes application work and compiler internals and has no direct add/remove intent workflow. Its resolver already rejects missing exact versions and verifies pinned SHA-256 artifacts; those protections must survive the new transactional commands.

## What Changes

- **BREAKING** Replace old root dispatch with new/check/build/run/test/fmt/doc/add/remove/update/package/toolchain/doctor/dev; provide errors with canonical replacements rather than hidden aliases.
- Bundle offline default application creation and separate template management.
- Add preserving dependency transactions, unambiguous selection, scoped updates, strict failures and independent locked/offline contracts.
- Specify streams, status, argument forwarding, versioned JSON, capability negotiation and synchronized consumers.
- Retain all archive, portable lock, containment and immutable registry protections.

## Capabilities

### New Capabilities

None: these obligations deepen existing capability authorities.

### Modified Capabilities

- `tooling--cli--command-surface`: canonical grammar, help, output, migration and provisioning.
- `tooling--cli--build-analyze-run-contract`: noninteractive progress, check and child execution.
- `tooling--cli--hi-command`: retained removal and canonical graph exception.
- `tooling--graph-visualization--contracts-and-edge-cases`: canonical developer graph and explicit TUI.
- `tooling--cli--repl-command`: canonical developer route without changing evaluation semantics.
- `tooling--project-scaffolding--beskid-new`: bundled app, listing and explicit template selection.
- `tooling--manifests-and-lockfiles--project-manifest-contract`: preserving dependency intent and selection.
- `tooling--manifests-and-lockfiles--workspace-and-lock-contracts`: recoverable pair transactions and explicit update scope.
- `compiler--resolution-and-projects--registry-and-overrides-contract`: strict coordinates and stable selection.
- `compiler--resolution-and-projects--workspace-and-lock-contracts`: scope/network policy while preserving pinned artifacts.
- `tooling--vscode-extension--workspace-project-explorer`: negotiated canonical operations.

## Impact

Clap/dispatch, shared project resolver, BSOL span editor, template services, AOT subprocess execution, editor, docs, CI and installed gates. No new Git/range resolver, channels or credential transfer. See `docs/superpowers/plans/2026-10-04-v06-cli-dependencies.md`; implementation remains unperformed.
