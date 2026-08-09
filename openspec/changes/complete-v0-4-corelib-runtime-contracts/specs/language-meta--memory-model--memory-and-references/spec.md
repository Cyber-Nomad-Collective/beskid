## MODIFIED Requirements

### Requirement: Arrays heap and null prohibition
`T[]` values MUST use the manifest-derived `BeskidArray` header and a precise
immutable element descriptor carrying stride, alignment, and pointer-map data.
Non-empty arrays MUST have real managed storage. Safe array length, get, and
set operations SHALL lower directly through generation-bound typed ISLE facts:
they MUST check the logical bound and address arithmetic before memory access,
and MUST NOT call `array_get` or `array_set`. Dynamic growth MUST use the sole
manifest-owned typed grow operation and preserve descriptor, logical length,
initialized values, roots, and barriers.

Reference-bearing values that escape their defining frame MUST live on the
precisely traced GC heap. A managed aggregate or array under construction MUST
remain rooted through every allocation-capable initializer and pointer store.
Pointer stores to managed objects or arrays MUST execute the canonical write
barrier before a safepoint when required by the active GC phase. User code MUST
NOT expose manual `free`, untracked pointers, or `null`; optional absence MUST
use `Option<T>`.

#### Scenario: Null literal is rejected
- **GIVEN** a program that uses a `null` literal as a value
- **WHEN** the program is type-checked
- **THEN** the compiler rejects `null` and requires `Option<T>` or an explicit
  absent variant

#### Scenario: Direct indexing checks bounds and arithmetic
- **GIVEN** a managed `T[]` and an index expression
- **WHEN** typed ISLE lowering emits an element load or store
- **THEN** logical bounds and address arithmetic are checked before direct
  memory access and no element-access runtime import is emitted

#### Scenario: Aggregate pointer publication is traced
- **GIVEN** a newly allocated managed aggregate whose pointer initializer can
  allocate
- **WHEN** construction stores that initializer into the aggregate
- **THEN** owner and value remain rooted through evaluation and the edge is
  barred before any allocation or safepoint can observe it

#### Scenario: Typed growth preserves live references
- **GIVEN** a pointer-bearing array with live initialized elements
- **WHEN** manifest-owned growth runs under collection pressure
- **THEN** the source and result remain rooted during copy and every initialized
  referent remains reachable through the preserved pointer map
