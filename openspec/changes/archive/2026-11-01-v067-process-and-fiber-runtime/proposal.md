## Why

Programs in the beskid-lings course hit four runtime problems. `Process.Run` does not search `PATH` and treats a non-zero exit code as an error. `Channel.Receive` called from `Main` returns `Closed` early instead of waiting. The process does not end when `Main` returns while a detached fiber waits for input. A receive error from the runtime has no variant for an unknown code. Evidence: MAP triage of 2026-10-24.

## What Changes

- `Process.Run` searches `PATH` and returns `Ok(output)` whenever the child started. The caller checks `exitCode`. `Process.Message(error)` returns the error text.
- Blocking operations in `Main`, including `Channel.Receive`, park the fiber.
- `ChannelError`, `HubError` and `MutexError` get `Unexpected(code)`.
- When `Main` returns, the process ends, even if detached fibers wait in I/O.

## Capabilities

### Modified Capabilities
- `core-library--foundation-and-primitives--core-process`, `core-library--concurrency--concurrency-package`, `execution--runtime--channels-and-synchronization`.

## Impact

Corelib `Process` and `Concurrency` packages, runtime scheduler and fibers. Target release: 0.6.7.

## Compatibility, Migration and Reversion

No users exist. Code that matched an exit-code error must check `exitCode` instead. There is no compatibility path.
