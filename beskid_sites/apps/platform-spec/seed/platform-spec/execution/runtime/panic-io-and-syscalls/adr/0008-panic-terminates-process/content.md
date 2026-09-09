import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Language `Option` covers expected errors. Unrecoverable faults and some IO failures need a distinct path that does not conflate with `Result` channel semantics.

## Decision

| Mechanism | Use |
| --- | --- |
| `Option` / `Result` | Expected failures (language-meta + corelib) |
| `panic` / `panic_str` | Unrecoverable faults, hard IO faults in v1 streams, allocation failures |
| Unwind | **No** Beskid stack unwinding across panics |
| Outcome | Runtime panics **terminate** the process (trap / abort) |
| Builtin kind | `AbiReturnKind::Never` in `BUILTIN_SPECS` |

## Consequences

Corelib **must not** catch panics for ordinary control flow. Fiber **Detach** panics still abort unless future domain recovery is specified.

## Verification anchors

`beskid_runtime::builtins::panic_io`; e2e runtime cases.
