---
title: "Beskid LSP Docs"
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

## Extended feature set

- Completion
- References
- Rename (+ prepareRename)
- Code actions (deterministic fixes first)
- Workspace symbols
- Semantic tokens

## Locked decisions (approved)

- Runtime mode: **stdio-only** LSP server (no extra CLI subcommands for now).
- Baseline dependencies: `tokio`, `tower-lsp-server`, `tracing`.
- Baseline capability scope: diagnostics, hover, document symbols, go-to-definition.
- Text sync strategy: start with `TextDocumentSyncKind::FULL` and evolve to incremental later.

## Ownership and evolution

- This documentation is the contract for LSP implementation work.
- Any capability addition should update:
  1. the architecture/spec file,
  2. the capability matrix in this index,
  3. the testing/observability expectations.
