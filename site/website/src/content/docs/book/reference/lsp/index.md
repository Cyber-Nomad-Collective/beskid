---
title: Beskid LSP Docs
description: Beskid LSP documentation index and scope map
---


This directory defines the architecture and protocol contract for the Beskid language server using `tower-lsp-server`.

## Document layout

1. `architecture-and-protocol-spec.md`
   - Product vision and scope
   - LSP capability matrix (baseline and extended)
   - Server architecture and crate/module boundaries
   - Compiler/analyzer integration contracts
   - Data model, concurrency, and cancellation strategy
   - Span/position/diagnostic mapping rules

2. `testing-and-observability.md`
   - Test strategy (unit/integration/protocol/regression)
   - Performance and correctness SLOs
   - Telemetry/logging/metrics design
   - Release readiness checklist

The CLI docs for [`beskid fmt`](/book/reference/cli/commands/format/) (and the [command reference index](/book/reference/cli/command-reference/)) describe `format_program`, the same entry point as document formatting.

## Design principles

- **Single source of truth:** semantic behavior must come from `beskid_analysis`, not duplicated in `beskid_lsp`.
- **Correctness over breadth:** capabilities are enabled only when behavior is production-safe.
- **Low-latency feedback:** incremental and cancelable document analysis loops.
- **Stable diagnostics:** deterministic outputs with stable codes and consistent ranges.
- **DRY + SOLID boundaries:** protocol adapters in LSP crate, language intelligence in analysis crates.

## Baseline feature set

- Lifecycle: initialize/initialized/shutdown/exit
- Text synchronization: open/change/save/close
- Diagnostics publishing
- Document symbols
- Hover
- Go to definition
- Completion
- References
- Semantic tokens (full)
- Document formatting
- Range formatting (currently full-document replacement strategy)

## Extended feature set

- Rename (+ prepareRename)
- Code actions (deterministic fixes first)
- Workspace symbols

## Native Mod host

Project preparation runs the project's active native Mods. By default the server uses the `beskid` CLI installed next to it as the Mod host. A client can select another host with an initialization option:

```json
{ "modHost": { "path": "/opt/beskid/bin/beskid", "runtimePrefix": "/opt/beskid", "runtimeProfile": "release" } }
```

Every key is optional, but the object needs at least one. `path` is an absolute path to a `beskid` executable, `runtimePrefix` an absolute installation prefix with an exact runtime kit, and `runtimeProfile` (`debug` or `release`) requires `runtimePrefix`. An invalid value fails `initialize` with `InvalidParams`; the server never falls back to the installed host, and the selected host still has to pass Mod artifact qualification. The server never builds Mods; see [Prebuilt Mods and the editor](/book/15-mods-plugins-with-consequences/beskid-mod-cli/#prebuilt-mods-and-the-editor). A failed project preparation is published as a `project-preparation` error diagnostic and logged.

## Locked decisions (approved)

- Runtime mode: **stdio-only** LSP server (no extra CLI subcommands for now).
- Baseline dependencies: `tokio`, `tower-lsp-server`, `tracing`.
- Baseline capability scope: diagnostics, hover, document symbols, go-to-definition.
- Text sync strategy: start with `TextDocumentSyncKind::FULL` and evolve to incremental later.
- Formatting strategy: call analysis formatter (`format_program`); range formatting currently returns full-document edits.

## Ownership and evolution

- This documentation is the contract for LSP implementation work.
- Any capability addition should update:
  1. the architecture/spec file,
  2. the capability matrix in this index,
  3. the testing/observability expectations.
