## MODIFIED Requirements

### Requirement: Cross-fiber sharing
Values MUST NOT be shared across fibers by alias unless immutability is proven or synchronization uses `Channel<T>`. Capturing mutable shared state in `spawn` closures SHOULD be rejected when detectable. Closure environments MUST outlive uses tracked by the compiler’s capture analysis.

Immutability SHALL be proven by the transfer class query: a value whose type is Shared is immutable and MAY be aliased across fibers and, from 0.6.3, across runtime instances. A value of any other class SHALL NOT cross a runtime instance boundary by alias. Fibers, `spawn` and `Channel<T>` SHALL stay inside one runtime instance; nothing in this release moves a value between heaps.

#### Scenario: Unsynchronized cross-fiber alias
- **GIVEN** a mutable value aliased into two fibers without proven immutability or a `Channel<T>`
- **WHEN** sharing analysis runs
- **THEN** the compiler rejects the sharing or diagnoses detectable mutable capture

#### Scenario: Shared record aliased by two fibers
- **GIVEN** `[Immutable] pub type Config { string name, i64 retries }` and two `spawn` operands that both read a `Config` local
- **WHEN** sharing analysis runs
- **THEN** the alias is accepted because `Config` is Shared

## ADDED Requirements

### Requirement: String immutability invariant
`string` SHALL be an immutable value: no language operation and no corelib function SHALL change the bytes or length of an existing string record. The runtime's string data setter (`beskid_rt_v5_utf8_record_set_data`) SHALL be called only on a record that has not yet been returned to any caller (construction), and the runtime corpus SHALL have no other writer of a string record's `data`, `length` or payload after construction. A test SHALL assert that the manifest exports no other string mutator and that every call site of the setter in the runtime corpus is inside a construction routine.

#### Scenario: String bytes are stable under aliasing
- **GIVEN** `string a = "left"; string b = a;` followed by any sequence of corelib string operations on `b`
- **WHEN** `a` is read afterwards
- **THEN** `a` is still `"left"`

#### Scenario: Setter outside construction is rejected by review test
- **GIVEN** a runtime corpus edit that calls `Utf8RecordSetData` on a record obtained from an existing `string`
- **WHEN** the runtime invariant test runs
- **THEN** it fails naming the call site

### Requirement: Field reads through typed receivers
The class of a value read from a field or element SHALL follow from the receiver's type and the field's type, with exactly three rules and no adaptation table:

1. A field of an `[Immutable]` object is Shared (its type is Shared by construction), and the read yields a Shared value.
2. A field of Shared type read through an `[Isolated]` object yields a Shared value.
3. A field of Moved type read through an `[Isolated]` object, or an element of a `T[]` with `T` Moved, yields a borrow: a non-owning name that may be read and mutated and that may not be stored, captured, returned or `move`d.

There SHALL be no fourth case: an `[Immutable]` type cannot hold a Moved field (**E1244**), and types without a marker are subject to no rule. Read-only reference views (`box`) and write-unique references (`trn`) are not part of Beskid; immutability and isolation are properties of types, not of references.

#### Scenario: Shared field through an isolated receiver
- **GIVEN** `[Isolated] pub type Index { List<string> terms, string name }` and `string Name(Index index) { return index.name; }`
- **WHEN** the read is classified
- **THEN** `index.name` is a Shared value and may be returned

#### Scenario: Moved field through an isolated receiver is a borrow
- **GIVEN** the same `Index` and `List<string> Terms(Index index) { List<string> t = index.terms; return t; }`
- **WHEN** the read is classified
- **THEN** `t` is a borrow of `index.terms`

#### Scenario: Element of an array of arrays is a borrow
- **GIVEN** `u8[] First(u8[][] blocks) { return blocks[0]; }`
- **WHEN** the read is classified
- **THEN** `blocks[0]` is a borrow
