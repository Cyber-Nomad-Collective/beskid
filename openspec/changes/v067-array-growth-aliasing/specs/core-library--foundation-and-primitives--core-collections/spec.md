## MODIFIED Requirements

### Requirement: Manifest-owned typed dynamic array growth
`runtime_manifest.bsol` SHALL declare exactly one
`beskid_rt_v5_array_grow_rooted(pointer array, usize minimum_capacity, pointer
root_handle_out) -> pointer` export. The canonical runtime MUST derive the
source array's immutable element descriptor, validate ownership, stride,
alignment, pointer map, length, capacity, and every size/address computation,
and return an array with the same descriptor, logical length, initialized
values, and a capacity at least `minimum_capacity`. The source and result MUST
remain rooted during allocation and copy, and a successful result MUST remain
rooted until the caller completes its owner-field store and required barrier.
No alternate collection-specific grow implementation SHALL exist.

Bit 0 of the hidden element-descriptor word (immediately before the public
array header) is the array's sharing mark. Generated code SHALL set the mark
where a second handle to the array is made, and a growth of a marked array
SHALL request more than the current capacity, so the runtime copies. Every
runtime read of the element descriptor MUST clear the mark. An array that the
runtime allocates or copies MUST be unmarked. When the runtime copies, the new
capacity SHALL be the larger of `minimum_capacity`, twice the length, and 4.

#### Scenario: Pointer-bearing storage grows under collection pressure
- **GIVEN** a rooted array of pointer-bearing elements with a valid descriptor
  and initialized values
- **WHEN** typed growth allocates and a collection occurs during the copy
- **THEN** every initialized referent remains reachable, the new array retains
  the identical stride/alignment/pointer map, and the returned construction
  root remains live until finish

#### Scenario: Invalid or overflowing growth fails closed
- **GIVEN** an unowned array, malformed descriptor, impossible minimum
  capacity, or overflowing byte calculation
- **WHEN** typed growth validates the request
- **THEN** it returns failure with a zero root token, leaves the source array
  unchanged, publishes no partial result, and leaks no root

#### Scenario: A marked array grows into an unmarked copy
- **GIVEN** an array with length 1, capacity 4 and the sharing mark set
- **WHEN** generated code grows it by one element
- **THEN** the runtime returns a new unmarked array with length 2 and capacity
  5, and the source array keeps length 1, capacity 4 and its elements
