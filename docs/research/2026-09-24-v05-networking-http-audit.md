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
- A deliberate live-socket shutdown test passes 4/4 in the Linux
  `NetworkNativeTests` target on compiler branch `codex/network-shutdown-test`
  (`f8c383a1`). It verifies a nonzero leak count, handle closure, and
  idempotent repeated shutdown. Truthful operation/winner diagnostics remain
  open; the native hook still hard-codes both details. The test calls the
  shutdown hook directly, so a process-level nonzero leak-check failure is
  not yet independently tested.
- For the HTTP 81/81 builder run, the test project's generated
  `/workspace/compiler-http/corelib/beskid_corelib/tests/corelib_tests/Project.lock`
  names `/workspace/compiler-http/corelib` for its root and every dependency.
  The materialized `Http/Codec.bd` has the same SHA-256 as that checkout's
  source (`f6b337a6a53b10d93d8f65db13da91e429e813e07e9090453af47aaee6e37516`).
  This records provenance for that run; other committed `Project.lock` files
  still contain stale absolute paths and remain a repository hygiene gap.

These branches have not been merged into `main`; the original 45-item
classification must not be presented as a post-integration release result.

## Combined-candidate release-gate update (2026-09-25)

The unmerged combined candidate (`codex/v05-release-candidate` at `25aca99b`)
passes Linux corelib 81/81 and runtime 7/7, but its broader
`cargo test -j 4 --workspace --all-targets --no-fail-fast` run is not green:
2913 passed and 23 failed across 292 completed binaries. The log is
`/var/lib/beskid-codex-build/run/v05-rc-workspace-tests.log` inside the Linux
builder container; `scripts/diagnose/cargo-log.py` enumerates the failures.

All 14 failing candidate `beskid_e2e_tests` cases are also in the clean-main
failure set (main has one additional e2e failure). Eleven of the 14 stop before
the requested build because the Rust tests name removed `Project.proj` or
`Workspace.proj` manifests while the checked-in fixtures have `.bproj` and
`.bws` files. The other three use stale fixture source or output assertions:
`runtime_calls` has obsolete call arity/type and `read_len` spelling,
`event_unsubscribe` has an unknown `User` module path and `fieldmut` syntax,
and `smoke_fixture_build_graph_includes_corelib_dependency` reaches an unused
private `Main` diagnostic. These are baseline harness debts, not proof of a
candidate-only regression, but the full-workspace release gate remains red.

Separately, the candidate's incremental and `corelib_mvp` tests report E1105
for `Core.*` imports inside reachable corelib shards in a Std application;
clean main passes the targeted cases. The reused runtime-fixture scheduler
tests expose a lock-replay authority-path bug that disappears in clean source
copies. The legality inventory exposes an unclassified `aggregate_literal`
finding for opaque `Deadline`. Those are not resolved by repairing e2e
fixtures, so this audit does not treat the passing corelib/runtime matrices as
full release evidence.

On the exact combined candidate, focused Linux checks additionally pass:
`NetworkTcpTests` 4/4, `NetworkDisposableTests` 2/2,
`HttpCodecTests` 13/13, `HttpSerializationTests` 4/4, and
`HttpExchangeTests` 5/5. A shared Cargo target directory had briefly
replaced the candidate CLI with a main-built binary; rebuilding the candidate
CLI restored its match with the candidate kit before these reruns.

The HTTP Host parser still accepts at least the invalid bracketed IPv6 form
`[1:::2]`: its `Ipv6` cursor skips a third colon while consuming `::`.
The existing rejection test for `[:::::::]` does not cover this form. HTTP
strictness and public network deadlines remain incomplete; the owner has been
asked to approve the bounded Host fix and to decide whether `SetDeadlines`
updates operations already pending.
