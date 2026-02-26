---
description: Beskid LSP phased implementation and delivery plan
---

# 02. Beskid LSP Implementation Plan

## 1. Delivery strategy

Implement in vertical slices with release-quality gates per phase.

Principles:

- Land minimal but complete capabilities.
- Keep each phase testable in isolation.
- Avoid enabling protocol capabilities before backend correctness exists.

## 2. Milestones

## Phase 0 — Foundation and bootstrap

### Goals

- Create runnable server skeleton in `beskid_lsp`.
- Wire basic lifecycle handlers.
- Establish shared state and document snapshot management.

### Work items

1. Add dependencies in `src/beskid_lsp/Cargo.toml`:
   - `tower-lsp-server`
   - `tokio`
   - `ls-types` (if needed directly)
   - `serde`, `serde_json`
   - `tracing`
2. Define `ServerState`, `DocumentState`, and config models.
3. Implement:
   - `initialize`
   - `initialized`
   - `shutdown`
4. Add stdio server entrypoint and basic structured logging.

### Acceptance criteria

- Server starts and completes initialize handshake in editor/client.
- No panics on lifecycle calls.

## Phase 1 — Diagnostics MVP

### Goals

- Provide robust, low-latency diagnostics on open/change/save.

### Work items

1. Implement text document handlers:
   - `did_open`
   - `did_change`
   - `did_save`
   - `did_close`
2. Build analysis bridge:
   - parse source
   - run semantic pipeline (`builtin_rules + run_rules`)
3. Implement diagnostic adapter to LSP diagnostics.
4. Implement publish dedupe and version guard.
5. Add debounce + cancellation for didChange.

### Acceptance criteria

- Diagnostics align with CLI analysis for the same source.
- No stale diagnostics after rapid edits.
- Closing file clears diagnostics.

## Phase 2 — Navigation MVP

### Goals

- Enable baseline semantic navigation features.

### Work items

1. Implement `document_symbol` for top-level declarations.
2. Implement `hover` with concise type/signature summaries.
3. Implement `goto_definition` using resolver-derived locations.
4. Harden range conversions and null-result behavior.

### Acceptance criteria

- Symbol list is stable and correctly ranged.
- Definition jumps to declaration spans for supported symbols.
- Hover returns deterministic content without crashes.

## Phase 3 — Productivity features

### Goals

- Expand editor intelligence for daily coding workflows.

### Work items

1. Completion:
   - keywords
   - locals
   - module/top-level symbols
2. References provider.
3. Rename:
   - `prepare_rename`
   - `rename` with workspace edit
4. Code actions for deterministic quick fixes.

### Acceptance criteria

- Rename applies coherent multi-location edits for supported symbols.
- Reference results are stable and deduplicated.
- Code actions are safe and idempotent.

## Phase 4 — Semantic richness and scale

### Goals

- Improve readability and scale behavior.

### Work items

1. Semantic tokens.
2. Workspace symbols.
3. Optional background indexing for opened workspace files.
4. Performance tuning and memory pressure controls.

### Acceptance criteria

- Latency SLOs met on representative projects.
- Memory usage bounded under long sessions.

## 3. Work breakdown structure

## 3.1 Protocol layer

- Capability negotiation
- request/notification handlers
- client messaging and diagnostics publication

## 3.2 Document/state layer

- versioned text store
- task scheduling and cancellation
- snapshot consistency guarantees

## 3.3 Semantic adapter layer

- parser/analysis invocation
- normalized symbol extraction
- shared span conversion and typed result modeling

## 3.4 Feature layer

- diagnostics
- symbols
- hover
- definition
- later: completion/references/rename/actions

## 4. Risk register

1. **Range conversion mismatch (UTF-16 vs byte spans)**
   - Mitigation: single conversion module + dedicated tests.
2. **Stale publish race conditions**
   - Mitigation: version-gated publication + cancellation tokens.
3. **Latency spikes on frequent edits**
   - Mitigation: debounce + bounded concurrent tasks.
4. **Feature correctness drift from analyzer changes**
   - Mitigation: shared adapters and integration tests against fixtures.

## 5. Definition of done (DoD)

A phase is complete only when:

- capability is advertised and functional,
- tests cover happy path + key edge cases,
- logs/metrics capture latency and failures,
- no critical known regression remains,
- docs are updated in this `docs/lsp` directory.

## 6. Rollout plan

1. Internal alpha with diagnostics only.
2. Add navigation features and expand fixture corpus.
3. Add productivity features behind capability flags if needed.
4. Stabilize and enable by default.

## 7. Suggested immediate implementation order

1. Phase 0 skeleton
2. Phase 1 diagnostics loop
3. Range conversion hardening
4. Document symbols
5. Definition
6. Hover
7. Then completion/references/rename/actions
