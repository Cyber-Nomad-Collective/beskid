# Beskid 0.5 HTTP and Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship strict bounded HTTP/1.1 and complete 0.5 release evidence after the networking API is conformant.

**Architecture:** The parser works over `Core.IO.Reader` and `u8[]` with explicit counters and limits; it does not depend on incomplete parser or collection facilities. The server uses the delivered Fiber, Channel, deadline, TCP, and `use` semantics directly so graceful shutdown remains visible and joinable.

**Tech Stack:** Beskid corelib, compiler/runtime conformance tests, OpenSpec, Bun website/Tracker tooling.

## Global Constraints

- Linear authority: CYB-62, blocked by CYB-61.
- Create `openspec/changes/beskid-v0-5-http/`; final catalog generation occurs only after all three changes validate.
- Defaults: request line 8 KiB; headers 16 KiB/100 count; body 1 MiB; 100 requests per connection; queue 128; initial-read/write 10s; keep-alive 30s.
- Explicitly retain every listed 0.5 exclusion; do not introduce a middleware framework or detached-worker workaround.

### Task 1: Create the HTTP/release OpenSpec change

**Files:**
- Create: `openspec/changes/beskid-v0-5-http/{proposal.md,design.md,tasks.md,.openspec.yaml}`
- Create: deltas for HTTP types, parser/serialization, routing/server lifecycle, release/versioning, documentation traceability, and Tracker delivery.

- [ ] Specify bounded parser behavior, framing rejection, deadlines, graceful shutdown ordering, examples, platform evidence, and exclusions using stable requirements and scenarios.
- [ ] Run `bun run openspec:validate`; commit `docs(openspec): specify beskid 0.5 http release`.

### Task 2: Add bounded HTTP types, headers, and parser

**Files:**
- Create: `compiler/corelib/packages/http/src/Http/{Types.bd,Errors.bd,Headers.bd,Parser.bd}` and package manifest/export files.
- Test: new `compiler/corelib/beskid_corelib/tests/corelib_tests/src/http/**` parser tests.

- [ ] Write failing tests for request-line limits, obsolete folding, malformed methods/versions, duplicate/conflicting `Content-Length`, `Content-Length` plus chunked framing, malformed chunks, premature EOF, header/body limits, and pipelined input.
- [ ] Implement a byte/cursor parser over `Reader` and `u8[]`; maintain explicit byte/header/request counters and ASCII case-insensitive names.
- [ ] Run corelib parser tests; commit `feat(http): add bounded request parser`.

### Task 3: Add response serialization and exact router

**Files:**
- Create: `compiler/corelib/packages/http/src/Http/{Serializer.bd,Router.bd}`
- Test: response framing, partial-write, exact method/path, and optional named-segment tests.

- [ ] Write failing tests for content length, chunked responses, connection close, partial writes, exact route matching, and unmatched routes.
- [ ] Implement serializer through `WriteAll`; implement exact method/path routing without middleware.
- [ ] Run corelib tests; commit `feat(http): add serializer and router`.

### Task 4: Implement joinable HTTP server and graceful shutdown

**Files:**
- Create: `compiler/corelib/packages/http/src/Http/Server.bd`
- Test: server loopback, slowloris deadline, keep-alive cap, queue backpressure, lifecycle, and graceful-shutdown integration tests.

- [ ] Write failing tests for one accept fiber, bounded connection queue, worker join lifecycle, active-worker deadline, listener close, queue drain, grace timeout, cancellation, and final stream closure.
- [ ] Implement the exact shutdown sequence: signal; close listener; join accept fiber; close queue; drain; signal workers; wait grace deadline; cancel; join; close streams; return typed result.
- [ ] Run networking plus HTTP loopback JIT/AOT/native tests; commit `feat(http): add joinable server lifecycle`.

### Task 5: Add compiling examples and documentation

**Files:**
- Create: CI-compiled `.bd` examples for fibers, channels, `use`, TCP, UDP, DNS, HTTP handler/router/server/shutdown in the repository’s existing examples location.
- Modify: `site/website/src/content/docs/book/**`, `compiler/corelib/beskid_corelib/docs/**`, website example indexes, package exports, and release-status surfaces.
- Modify: `CHANGELOG.md` only after preserving and reconciling existing user edits.

- [ ] Add examples only after their APIs are complete; add CI analysis/JIT/AOT/native matrix entries that compile and execute them where applicable.
- [ ] Document ownership, deadlines, platform support, shutdown, and exclusions with OpenSpec links.
- [ ] Commit `docs: publish beskid 0.5 networking guide and examples`.

### Task 6: Catalog, Tracker, and final validation

**Files:**
- Modify: generated `openspec/catalog.json` only via `bun run openspec:catalog`.
- Modify: Tracker 0.5 delivery data/schema only after confirming its canonical seed or runtime workflow.
- Modify: release metadata and CHANGELOG after preserving existing changes.

- [ ] Run `bun run openspec:catalog && bun run openspec:validate`, website checks, package/export validation, compiler/corelib/runtime/JIT/AOT/native suites, HTTP security tests, and every locally available platform test.
- [ ] Add CI evidence for unavailable platforms; write exact command/results and catalog revision to CYB-62 and Tracker delivery references.
- [ ] Run GitNexus `detect_changes({scope: "compare", base_ref: "main"})` before committing; report changed execution flows and risk.
- [ ] Commit `docs(release): record beskid 0.5 completion evidence` only when every required command passes.
