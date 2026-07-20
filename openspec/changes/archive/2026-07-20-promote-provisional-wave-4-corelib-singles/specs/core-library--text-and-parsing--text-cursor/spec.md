## ADDED Requirements

### Requirement: Cursor state shape
`Core.Text.Cursor` MUST track `{ source: string, pos: i64 }` (**CURSOR-001**).

#### Scenario: Cursor exposes source and position
- **GIVEN** a `Cursor` constructed from a source string
- **WHEN** a caller inspects cursor state
- **THEN** the cursor holds that source and a byte offset `pos` of type `i64`

### Requirement: Bounds-safe Slice, Drop, Peek, and Advance
`Slice`, `Drop`, `Peek`, and `Advance` MUST be bounds-safe (**CURSOR-002**).

#### Scenario: Advance at end of source
- **GIVEN** a `Cursor` whose `pos` is at the end of `source`
- **WHEN** a caller invokes `Peek` or `Advance`
- **THEN** the operation remains bounds-safe and does not read past the source

### Requirement: Position returns current byte offset
`Position` MUST return the current byte offset (**CURSOR-003**).

#### Scenario: Position matches pos
- **GIVEN** a `Cursor` with `pos` set to a known byte offset
- **WHEN** a caller invokes `Position`
- **THEN** the returned value equals that byte offset

### Requirement: Allocation-light hot paths
Hot paths MUST NOT allocate except for `Slice` / `Drop` views (**CURSOR-004**).

#### Scenario: Peek and Advance do not allocate
- **GIVEN** an existing `Cursor` over a source string
- **WHEN** a caller invokes `Peek` or `Advance` on a hot path
- **THEN** the call does not allocate; only `Slice` or `Drop` may allocate view materialization

## REMOVED Requirements

### Requirement: Core.Text.Cursor conformance status
**Reason**: Replaced by explicit behavioral requirements extracted from migrated source.
**Migration**: Cite the ADDED requirements above.
