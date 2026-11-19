# Design: process and fiber runtime (0.6.7)

- `Process.Run` returns `Ok(ProcessOutput)` for every exit code once the child started. The `ExitCode` variant is removed. The error set is `NotFound`, `PermissionDenied`, `IOError(string)`, `InvalidInput`, `Cancelled`, `TimedOut`, `Closed`, `Busy`, `CleanupFailed`, `Unsupported`.
- Error text is a free function `Process.Message(error)`, not a member. Beskid enums have no member bodies, and the Corelib convention for error text is a free function (`Tls.Describe`, `Serialization.Code`, `Web.KindOf`). The wording follows the rt slice ruling.
- Command search follows the rules in the requirement: `PATH` of the child environment, `/usr/bin:/bin` on POSIX without `PATH`, `.exe` on Windows.
- `Main` is the root fiber and parks like every other fiber. The cause of the early `Closed` result was a shortcut for fiber 0. A deadlock of `Main` traps; it never returns a close-like error.
- Shutdown order: `Main` returns, the runtime joins non-detached fibers, then the process ends. A detached fiber that waits in I/O does not delay the end.
- Unknown runtime status codes map to `Unexpected(code)` in `ChannelError`, `HubError`, `MutexError` and `Status`.
