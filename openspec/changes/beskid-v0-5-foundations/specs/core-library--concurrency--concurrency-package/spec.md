## ADDED Requirements

### Requirement: Fiber<T> preserves the established lifecycle surface
`Concurrency.Fiber<T>` SHALL expose `Join() -> Result<T, FiberError>`, `Detach() -> unit`, and `Cancel() -> unit` as the only public lifecycle operations. `Join` and `Detach` MUST consume the move-only handle so a second terminal operation is rejected by semantic analysis; `Cancel` MUST remain idempotent and MUST NOT consume the handle. `FiberError` SHALL remain this closed public type; `Panicked` carries the exact `i64` child-panic status code and child panic uses code `2`:

```beskid
pub enum FiberError {
    Cancelled(),
    StackOverflow(),
    Panicked(i64 code),
}
```

**Stable ID:** `BSP-REQ-F61E094A4838`

#### Scenario: Detach after join is rejected statically
- **GIVEN** a `Fiber<i64>` whose `Join` has returned
- **WHEN** source attempts to invoke `Detach` on the consumed handle
- **THEN** semantic analysis rejects the use-after-move before runtime execution

### Requirement: Channel<T> documents value and resource ownership
`Concurrency.Channel<T>` SHALL document ownership at the send commit point, cancellation point, receive transfer point, and close-after-drain boundary. An opaque disposable fixture value such as `OwnedResource` MUST have one owner after each transition; channel close MUST NOT implicitly dispose it, and a receiver MUST become the owner only when receive succeeds.

**Stable ID:** `BSP-REQ-AF2C1DDC351E`

#### Scenario: Queued resource survives close
- **GIVEN** a `Channel<OwnedResource>` with one committed opaque disposable fixture and then `Close()`
- **WHEN** the receiver drains the channel
- **THEN** the receiver becomes the resource owner and no implicit disposal occurred

### Requirement: Disposable and Core.IO define typed cleanup and transfer contracts
The foundation package SHALL publish the following Beskid declarations:

```beskid
pub contract Disposable {
    Core.Results.Result<unit, DisposeError> Dispose();
}

pub enum DisposeError {
    Failed(),
}

pub enum IoError {
    InvalidRange(),
    UnexpectedEof(i64 completed),
    NoProgress(),
    ReadFailed(),
    WriteFailed(),
    CloseFailed(),
}

pub contract Reader {
    Core.Results.Result<i64, IoError> Read(u8[] destination, i64 offset, i64 count);
}

pub contract Writer {
    Core.Results.Result<i64, IoError> Write(u8[] source, i64 offset, i64 count);
}

pub contract Closer {
    Core.Results.Result<unit, IoError> Close();
}

pub contract Stream {
    Core.Results.Result<i64, IoError> Read(u8[] destination, i64 offset, i64 count);
    Core.Results.Result<i64, IoError> Write(u8[] source, i64 offset, i64 count);
    Core.Results.Result<unit, IoError> Close();
}

pub Core.Results.Result<unit, IoError> ReadExact(Reader reader, u8[] destination, i64 offset, i64 count);
pub Core.Results.Result<unit, IoError> WriteAll(Writer writer, u8[] source, i64 offset, i64 count);
```

Every `Read`, `Write`, `ReadExact`, and `WriteAll` call MUST validate its range before invoking the underlying reader or writer. Validation MUST reject, in order, a negative `offset` or `count`, arithmetic overflow in `offset + count`, and an end position greater than the selected buffer length; each rejection returns `IoError::InvalidRange()` without invoking the underlying implementation or mutating either buffer. A zero-length valid range MUST bypass the underlying implementation: base `Read` and `Write` return `Result::Ok(0)`, while `ReadExact` and `WriteAll` return `Result::Ok(unit)`.

For a non-empty base `Read` request, `Result::Ok(0)` SHALL mean EOF and MUST leave `destination` unchanged. A successful base `Read` returning `n` MUST satisfy `0 < n <= count`, write only `destination[offset..offset+n)`, and leave every other destination byte unchanged. `ReadExact` MUST loop until it transfers `count` bytes; if base `Read` reaches EOF first, it MUST return `IoError::UnexpectedEof(completed)` and preserve the completed destination prefix while leaving the remaining destination suffix unchanged. `WriteAll` MUST loop until all input transfers and MUST return `IoError::NoProgress()` if a non-empty write reports `Result::Ok(0)`. `Close` MUST be idempotent. `Core.IO` SHALL declare the explicit cleanup conversion from `DisposeError` to `IoError::CloseFailed()` so a scoped I/O resource can be used in a callable returning `Result<T, IoError>` without a hidden or general-purpose coercion.

**Stable ID:** `BSP-REQ-F25A4DF4DEA0`

#### Scenario: Partial write completes with WriteAll
- **GIVEN** a writer that accepts only part of a non-empty buffer on each call
- **WHEN** `WriteAll` receives the buffer
- **THEN** it keeps writing until the full buffer transfers or returns a typed error

#### Scenario: Zero-progress write fails
- **GIVEN** a writer that reports success with zero bytes for non-empty input
- **WHEN** `WriteAll` is invoked
- **THEN** it returns `IoError::NoProgress()`

#### Scenario: ReadExact preserves a partial destination on EOF
- **GIVEN** a reader that writes three bytes and then returns `Result::Ok(0)` while `ReadExact` requests five bytes into a destination buffer
- **WHEN** `ReadExact` completes
- **THEN** it returns `IoError::UnexpectedEof(3)`, preserves the three written destination bytes, and leaves the final two destination bytes unchanged

#### Scenario: Overflowing range is rejected before I/O
- **GIVEN** a buffer operation whose non-negative `offset + count` overflows `i64`
- **WHEN** `Read`, `Write`, `ReadExact`, or `WriteAll` validates the request
- **THEN** it returns `IoError::InvalidRange()` without invoking the underlying implementation or mutating the buffer

#### Scenario: Zero-length operation bypasses the implementation
- **GIVEN** a valid range with `count` equal to zero
- **WHEN** a base or exact/all Core.IO operation runs
- **THEN** it returns its zero-length success result without invoking the underlying reader or writer
