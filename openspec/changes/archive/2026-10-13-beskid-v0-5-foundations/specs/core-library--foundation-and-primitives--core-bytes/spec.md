## ADDED Requirements

### Requirement: Bytes copy is overlap-safe and bounds-checked
`Core.Bytes.Copy` SHALL behave as overlap-safe `memmove` for a source and destination that alias. It MUST permit zero-length copies without changing either buffer, MUST reject a source or destination range outside its buffer, and MUST preserve all bytes that the specified copy range defines.

**Stable ID:** `BSP-REQ-8E1AF054C89D`

#### Scenario: Overlapping copy moves backward safely
- **GIVEN** one byte buffer and a copy from range `[0, 4)` to range `[1, 5)`
- **WHEN** `Core.Bytes.Copy` completes
- **THEN** the destination contains the original four source bytes in order

### Requirement: Bytes cursors preserve checked position and capacity
`Core.Bytes` SHALL publish the following cursor declarations:

```beskid
pub enum BytesError {
    OutOfBounds(),
    InvalidRange(),
}

pub contract ByteReader {
    Core.Results.Result<i64, BytesError> Position();
    Core.Results.Result<i64, BytesError> Capacity();
    Core.Results.Result<u8[], BytesError> Read(i64 count);
}

pub contract ByteWriter {
    Core.Results.Result<i64, BytesError> Position();
    Core.Results.Result<i64, BytesError> Capacity();
    Core.Results.Result<unit, BytesError> Write(u8[] source, i64 offset, i64 count);
}
```

Byte readers and writers MUST expose checked position and capacity semantics. A read or write past the configured bounds MUST return `BytesError::OutOfBounds` without advancing position; a zero-length operation MUST return `Result::Ok` without advancing position; readers and writers MUST expose their resulting position after every successful transfer.

**Stable ID:** `BSP-REQ-391C7C5A5DD6`

#### Scenario: Reader overrun is rejected
- **GIVEN** a reader positioned at the final byte of a one-byte buffer
- **WHEN** it requests two bytes
- **THEN** it returns a typed bounds error and leaves position unchanged
