# v0.5 networking and HTTP audit (2026-09-24)

This audit compares the v0.5 networking and HTTP implementation with its specification. It checked compiler main `5987060e` and corelib `3f2ab81` against:

- `openspec/changes/beskid-v0-5-networking/`
- `openspec/changes/beskid-v0-5-http/`
- the networking prerequisites in `openspec/changes/beskid-v0-5-foundations/`
- `docs/superpowers/specs/2026-09-22-networking-v05-rulings.md`

This is a summary. The complete table for each requirement was not saved, because the audit ran in a sandbox that could not write files.

## Summary

| Classification | Count |
| --- | ---: |
| Implemented and tested | 19 |
| Implemented but untested | 19 |
| Partial | 5 |
| Missing | 2 |
| Total requirements and scenarios | 45 |

All 80 corelib test targets pass on Linux, including NetworkTcpTests and HttpExchangeTests. Most of the remaining work is missing test evidence. Few items are missing behavior.

An earlier run of this audit found most items missing. That result is wrong: the run read the stale `compiler/corelib` checkout in the root repository, and that checkout has no network or HTTP packages.

## Gaps, highest priority first

| # | Size | Class | Gap | Proposed test |
| ---: | :---: | --- | --- | --- |
| 1 | L | Missing | A scenario that closes on scope exit or on an explicit deadline conflicts with the design, which defers deadlines to v0.6. | Resolve the spec conflict first. Then add a deterministic test of deadline, readiness and close racing each other. |
| 2 | M | Missing | No evidence shows that the manifest parity check rejects an unregistered network operation. | Add a fixture with a deliberately mismatched generated registry, and expect a rejection before JIT and AOT. |
| 3 | M | Partial | The shutdown leak diagnostics hard-code the operation details and the winner. A shutdown that fails with a nonzero status is untested. | Add a fixture that deliberately leaks a pending operation. |
| 4 | L | Untested | These races have no single-winner tests: DNS cancellation, close against readiness, UDP contention, and TCP accept and write. | Add repeated race tests for each one. |
| 5 | M | Partial | The HTTP `Host` check accepts malformed IPv6 forms that have balanced brackets, for example `[:::::::]`. | Add table-driven tests of the IPv6 host grammar. |
| 6 | S | Partial | HTTP accepts a horizontal tab (HTAB) in field values, and control octets in start-line components. | Add byte-level rejection tests. |
| 7 | S | Provenance | The committed `Project.lock` files reference another worktree, so earlier test runs cannot be proven to have used the checked-out sources. | Regenerate the lock files, or record the paths that were resolved. |

## Verification update (2026-09-24)

The table above records the original audit against compiler `5987060e` and
corelib `3f2ab81`; it is not a count of remaining gaps after the following
branch work:

- The owner chose typed deadlines for v0.5. The revised OpenSpec delta passes
  strict validation (218/218). `Deadline.After`, compiler-authorized deadline
  projection, and an internal TCP-read deadline are implemented on isolated
  branches. The internal read test verifies timeout, zero active waits, and
  subsequent stream reuse. Public deadline APIs and the multi-winner race
  scenarios are still outstanding.
- A generated-registry mismatch rejection test passes 17/17 on Linux on
  compiler branch `codex/network-parity-test` (`283ca834`).
- HTTP Host, field-value, and start-line validation fixes are on corelib branch
  `codex/http-hardening-tests` (`24cadc8`), with the new target registered by
  compiler branch `codex/http-hardening-catalog` (`ba1fc823`). The Linux full
  corelib matrix passes 81/81 and the parity check passes.
- Shutdown still needs a deliberate-leak test and truthful operation/winner
  diagnostics. The existing native hook hard-codes both details.

These branches have not been merged into `main`; the original 45-item
classification must not be presented as a post-integration release result.
