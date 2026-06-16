---
title: Contracts and edge cases
description: MUST rules for standard stream reads, writes, and error handling.
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

Document **contracts and edge cases** for the **Console Io Streams** feature: role-specific normative detail beyond the feature hub.

## Canonical references

- Feature hub: [Console Io Streams](/platform-spec/core-library/terminal-and-console/console-io-streams/)
- Sibling articles in this bundle (design model, contracts, flow, examples, verification)

## Detailed behavior

### Normative requirements

| ID | Requirement |
| --- | --- |
| **IO-001** | `Core.Input.Read` and `ReadLine` **must** target **stdin only** via `Descriptor::Standard(Stdin)`. |
| **IO-002** | `Core.Output.Write` / `WriteLine` **must** target **stdout only**; `Core.Error` **must** target **stderr only**. |
| **IO-003** | `WriteLine(text)` **must** perform `Write(text)` then `Write("\n")` as two syscall writes (or equivalent atomic policy documented in runtime). |
| **IO-004** | Write helpers **must** panic with a stable message when `WriteWith` returns an error (`Core.Output.Write failed` / stderr variant). |
| **IO-005** | Read helpers **must not** panic on EOF; they return `Result` with an empty or partial string per syscall contract. |
| **IO-006** | Modules **must not** interpret ANSI sequences; validation of escape syntax is the responsibility of [ANSI escape model](/platform-spec/core-library/terminal-and-console/ansi-escape-model/). |

### Function contracts

| Function | Behavior |
| --- | --- |
| `Input.Read()` | Read up to default byte limit from stdin |
| `Input.ReadLine()` | Read until `\n` or EOF; line **without** trailing newline |
| `Output.Write(text)` | Write UTF-8 bytes to stdout, no newline |
| `Output.WriteLine(text)` | `Write(text)` + `Write("\n")` |
| `Error.Write` / `WriteLine` | Same as output, descriptor stderr |

### Edge cases

- **Redirected stdout**: Still writable; TTY detection happens only in [Console capabilities](/platform-spec/core-library/terminal-and-console/console-capabilities/), not in `Core.Output`.
- **Binary data**: `string` is UTF-8 text; writing invalid UTF-8 is undefined at the language level—console APIs assume valid strings.
- **Large writes**: Syscall layer may chunk; stream helpers do not expose partial-write `Result` in v1.
- **Concurrent fibers**: Multiple fibers writing stdout **may** interleave bytes; line-safe logging is the caller's responsibility (channels or mutex).

## Verification

See the verification and traceability article in this bundle and `compiler/corelib/beskid_corelib/tests/corelib_tests/src/console/`.

## Related topics

- Parent [feature hub](/platform-spec/core-library/terminal-and-console/console-io-streams/) and [Terminal and console area](/platform-spec/core-library/terminal-and-console/)
