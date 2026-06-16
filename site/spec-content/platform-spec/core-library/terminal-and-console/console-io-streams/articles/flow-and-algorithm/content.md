---
title: Flow and algorithm
description: Read and write algorithms for standard stream helpers.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-05-21
---

## Purpose

Document **flow and algorithm** for the **Console Io Streams** feature: role-specific normative detail beyond the feature hub.

## Canonical references

- Feature hub: [Console Io Streams](/platform-spec/core-library/terminal-and-console/console-io-streams/)
- Sibling articles in this bundle (design model, contracts, flow, examples, verification)

## Detailed behavior

### Write path

1. Caller supplies a Beskid `string` (UTF-8).
2. Module builds `WriteRequest` with `Descriptor::Standard(Stdout | Stderr)` and payload bytes.
3. `Syscall.WriteWith` invokes `__syscall_write`.
4. On `Result::Error`, module panics with the stable panic string (**IO-004**).

`WriteLine` chains two writes; callers **should not** embed `\n` in `text` when using `WriteLine` unless a double newline is intended.

### Read path (`ReadLine`)

1. Loop `ReadWith` on stdin with a byte limit until:
   - buffer contains `\n` → return slice before newline, or
   - EOF / error → return `Result` per syscall mapping.
2. No ANSI parsing occurs; escape bytes in stdin are returned literally to the caller.

### Console tick integration

`Console.RunTick` polls resize and may write control sequences via `Core.Output` after formatting. The tick loop **should** run on a fiber that owns the terminal UI; see [Console terminal events](/platform-spec/core-library/terminal-and-console/console-terminal-events/).

### Styled output flow

Markup or `Ansi` builders → gated string → `Core.Output.Write` / `WriteLine`. Capability probing runs **before** write, not inside `Output.bd`.

## Verification

See the verification and traceability article in this bundle and `compiler/corelib/beskid_corelib/tests/corelib_tests/src/console/`.

## Related topics

- Parent [feature hub](/platform-spec/core-library/terminal-and-console/console-io-streams/) and [Terminal and console area](/platform-spec/core-library/terminal-and-console/)
