## ADDED Requirements

### Requirement: Amortized canonical managed array growth
The canonical typed grow operation SHALL interpret requested capacity as a
minimum. When growth is needed, it SHALL reserve at least four elements for an
empty array, or twice the current capacity, unless the requested minimum is
larger. Geometric headroom whose checked backing-byte or aligned object-size
calculation overflows SHALL fall back to the exact minimum, which SHALL still
pass all existing checked size calculations. Growth SHALL preserve the element
descriptor, initialized values, logical length, and source/result construction
roots. Serialization and BSOL SHALL use this shared operation rather than a
second collection allocator.

#### Scenario: Successive append remains amortized under collection (SER-06-03)
- **GIVEN** an empty managed byte array with a valid canonical ABI descriptor
- **WHEN** 4096 elements are appended through repeated minimum-capacity growth and collections occur between appends
- **THEN** no more than 16 replacement arrays are allocated, all initialized bytes retain their values, and every successful construction root is released without corrupting the heap

#### Scenario: Capacity headroom does not invent an overflow failure (SER-06-03)
- **GIVEN** geometric headroom overflows a checked backing-byte or aligned object-size computation while the requested minimum remains representable
- **WHEN** the canonical grow operation validates the request
- **THEN** it uses the exact minimum and retains existing failure and rooting behavior
