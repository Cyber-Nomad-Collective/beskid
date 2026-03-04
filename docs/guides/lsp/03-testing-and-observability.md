---
description: Beskid LSP testing, performance, and observability specification
---

# 03. Beskid LSP Testing and Observability

## 1. Testing strategy

The LSP should be validated at four layers:

1. Unit tests (pure helpers and adapters)
2. Component tests (document state, scheduling, cancellation)
3. Protocol integration tests (`tower-lsp-server` request/response behavior)
4. Regression fixture tests (real `.bd` samples and known diagnostics)

## 2. Unit test matrix

## 2.1 Position conversion tests

- byte span -> LSP range conversion
- zero-length spans
- end-before-start normalization
- multibyte UTF-8 content (e.g., unicode chars)
- boundary clamping for invalid spans

## 2.2 Diagnostic adapter tests

- severity mapping correctness
- code propagation
- message and source assignment
- stable deterministic ordering

## 2.3 Feature mapper tests

- symbol kind mapping
- hover formatting
- definition location mapping

## 3. Component tests

## 3.1 Document synchronization

- didOpen inserts snapshot
- didChange updates text and version
- didSave triggers analysis
- didClose clears state and diagnostics

## 3.2 Concurrency and cancellation

- rapid edit burst cancels stale tasks
- only latest version publishes diagnostics
- no panic on cancellation races

## 3.3 Config handling

- config updates are applied safely
- invalid config payload is ignored with warning logs

## 4. Protocol integration tests

Use in-process `tower-lsp-server` harness where possible.

Scenarios:

1. initialize -> initialized -> diagnostics flow
2. open + change + save roundtrip
3. hover on symbol returns expected markdown
4. definition request returns expected location
5. unsupported requests return null/empty safely

## 5. Regression fixture suite

Create fixtures under `src/beskid_tests` or dedicated LSP fixtures:

- `diagnostics/`
  - duplicate names
  - unknown types
  - immutable assignment
  - match exhaustiveness
- `navigation/`
  - symbol listing
  - definition resolution
  - hover snapshots

Expected outputs:

- diagnostic codes
- ranges
- symbols and definition targets

## 6. Performance targets (initial SLO)

For medium files on developer hardware:

- P50 diagnostics latency <= 80ms
- P95 diagnostics latency <= 250ms
- No unbounded memory growth in 30-minute edit sessions

These values are initial and can be refined with real telemetry.

## 7. Logging and telemetry

## 7.1 Structured logging fields

- request_id
- method
- uri
- document_version
- elapsed_ms
- outcome (`ok`, `canceled`, `error`)

## 7.2 Metrics

Counters:

- `lsp_requests_total{method}`
- `lsp_analysis_runs_total`
- `lsp_analysis_canceled_total`
- `lsp_diagnostics_published_total`
- `lsp_errors_total{kind}`

Histograms:

- `lsp_request_latency_ms{method}`
- `lsp_analysis_latency_ms`

Gauges:

- `lsp_open_documents`
- `lsp_pending_analysis_tasks`

## 8. Failure policy

- Never crash on malformed request payloads.
- Return protocol-safe null/empty responses for recoverable failures.
- Log internal failures with context, but avoid noisy repeated logs.
- Preserve responsiveness by canceling expensive stale work.

## 9. CI gating recommendations

At minimum, CI should run:

1. Unit tests for conversion and mapping
2. Integration tests for diagnostics lifecycle
3. Lint + format checks
4. Regression fixtures for previously fixed bugs

Optional later:

- Benchmark smoke test for diagnostics latency budget.

## 10. Release readiness checklist

Before enabling broader usage:

- [ ] All MVP capabilities pass integration tests.
- [ ] Diagnostics parity with CLI is validated on fixture corpus.
- [ ] No known stale diagnostic race remains.
- [ ] Range conversion test coverage includes Unicode edge cases.
- [ ] Telemetry/logging is enabled at useful defaults.
- [ ] Documentation in `docs/lsp` is updated to reflect current behavior.
