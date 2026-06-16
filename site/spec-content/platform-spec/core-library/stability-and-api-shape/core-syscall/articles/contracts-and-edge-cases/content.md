---
title: Contracts and edge cases
description: MUST rules for Core.Syscall facade.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-06-06
---

## Normative requirements

| ID | Requirement |
| --- | --- |
| **SC-001** | `ReadWith` / `WriteWith` **must** route via typed `Descriptor`, not raw fd integers in stream modules. |
| **SC-002** | `ReadBytes` **must** support arbitrary non-negative fds via `Descriptor::Raw`. |
| **SC-003** | `WriteBytes` **must** accept `u8[]` payloads for arbitrary fds. |
| **SC-004** | `Core.Input` / `Output` / `Error` **must** use `Descriptor::Standard` only (**IO-001**, **IO-002**). |
| **SC-005** | `SyscallError` mapping **must** be stable across JIT/AOT. |
| **SC-006** | Linux write path **must** loop partial writes; read returns short buffers on EOF. |
| **SC-007** | Text `Read` **must** validate UTF-8 when building `string`. |
| **SC-008** | Binary `ReadBytes` **must not** validate UTF-8. |
| **SC-009** | Negative fd **must** return `InvalidFd` before syscall. |
| **SC-010** | `maxBytes < 1` **must** return `InvalidReadLimit`. |

## Implementation anchors

- `compiler/corelib/packages/foundation/src/Core/Syscall.bd`
- `compiler/corelib/packages/foundation/src/Core/Syscall/`
