## ADDED Requirements

### Requirement: Strict UTF-8 rejects non-scalar encodings
`Core.Encoding.Utf8.DecodeFromBytes` SHALL accept only shortest-form UTF-8 sequences encoding Unicode scalar values. It MUST return `EncodingError::InvalidSequence` for overlong encodings, surrogate code points, code points greater than `U+10FFFF`, invalid continuation bytes, and truncated sequences; it MUST NOT replace invalid input or panic. `Core.Encoding.DecodeHttpAscii(u8[] input) -> Core.Results.Result<string, EncodingError>` MUST reject every byte greater than `0x7F` and MUST return the corresponding ASCII string only for accepted input.

**Stable ID:** `BSP-REQ-6B3A72539DE6`

#### Scenario: Overlong UTF-8 is rejected
- **GIVEN** the two-byte overlong representation of an ASCII code point
- **WHEN** `Utf8.DecodeFromBytes` is invoked
- **THEN** it returns `EncodingError::InvalidSequence`

### Requirement: Hex and Base64 reject malformed encodings
Hex decoding SHALL reject odd-length input and non-hex characters. Base64 decoding SHALL use the RFC 4648 standard alphabet and SHALL reject invalid alphabet bytes, non-final padding, more than two padding bytes, invalid unused bits, and lengths not valid after padding rules; both decoders MUST return `EncodingError` rather than producing partial or lossy output.

**Stable ID:** `BSP-REQ-C1442592D817`

#### Scenario: Invalid Base64 unused bits are rejected
- **GIVEN** a Base64 input with valid alphabet characters but non-zero unused bits in its final quantum
- **WHEN** `Base64.DecodeFromBytes` is invoked
- **THEN** it returns `EncodingError`
