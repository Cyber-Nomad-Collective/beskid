---
title: Console I/O streams
description: Normative stdin/stdout/stderr contracts via Core.Syscall and split
  stream modules.
specLevel: feature
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-05-21
---

<SpecSection title="What this feature specifies" id="what-this-feature-specifies">
Split **standard stream helpers** in `corelib_foundation` (`Core.*`): `Core.Input` (stdin), `Core.Output` (stdout), and `Core.Error` (stderr). All traffic uses **`Core.Syscall.ReadWith`** / **`WriteWith`** with typed `Descriptor::Standard(StandardStream::*)` selectors—no direct fd integers in user code.
</SpecSection>

<SpecSection title="Contract statement" id="contract-statement">
| Stream | Module | Syscall descriptor | Read | Write |
| --- | --- | --- | --- | --- |
| stdin | `Core.Input` | `Stdin` | `Read`, `ReadLine` → `Result<string, SyscallError>` | **Not supported** |
| stdout | `Core.Output` | `Stdout` | **Not supported** | `Write`, `WriteLine` |
| stderr | `Core.Error` | `Stderr` | **Not supported** | `Write`, `WriteLine` |

- Encoding at the boundary is UTF-8 bytes of the Beskid **`string`** type.
- `WriteLine` **must** write the text then a single **`"\n"`** line feed (corelib policy; not CRLF unless host translates).
- `Write` / `WriteLine` failures from `WriteWith` **must** panic with `__panic_str("Core.Output.Write failed")` or the stderr equivalent—there is no `Result` on write helpers in v1.
- ANSI and markup **must not** be interpreted in these modules; escape bytes are ordinary string contents (see [ANSI escape model](/platform-spec/core-library/terminal-and-console/ansi-escape-model/)).
</SpecSection>

<SpecSection title="Implementation anchors" id="implementation-anchors">
- `compiler/corelib/packages/foundation/src/Core/Input/Input.bd`, `Output/Output.bd`, `Error/Error.bd`
- `compiler/corelib/packages/foundation/src/Core/Syscall/`
- Informative module docs: `compiler/corelib/beskid_corelib/docs/Core/Input.md`, `Output.md`, `Error.md`
</SpecSection>

## Decisions
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-CORE-TERM-0010` … `D-CORE-TERM-0012`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Contracts and edge cases](./articles/contracts-and-edge-cases/)
- [Design model](./articles/design-model/)
- [Examples](./articles/examples/)
- [Flow and algorithm](./articles/flow-and-algorithm/)
- [Verification and traceability](./articles/verification-and-traceability/)
<!-- /spec:generate:article-index -->
