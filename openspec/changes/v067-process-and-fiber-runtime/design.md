# Design: process and fiber runtime (0.6.7)

- `ProcessError::ExitCode` is removed from the variants that `Run` returns. A child that ran and exited with any code is `Ok`. `NotFound` means the search found no executable. `PermissionDenied` means the executable is not runnable. `IOError` means the runtime failed to start or to read the child.
- Command search follows the host rule: a command without a path separator is searched in the `PATH` directories in order; a command with a path separator is used as written.
- `Main` runs on fiber 0, which has no scheduler context that can park. The runtime gives it the same parking path as every other fiber. The cause of the early `Closed` result was a shortcut for fiber 0.
- Shutdown order: `Main` returns, the runtime joins non-detached fibers (D-CORE-CONC-0004), then the process ends. A detached fiber that waits in I/O does not delay the end. The runtime cancels its wait and ends the process without joining it.
- The receive error type gets one more variant, `Unexpected(i64)`, for a runtime code that the library does not know. Library code SHALL NOT panic for such a code.
