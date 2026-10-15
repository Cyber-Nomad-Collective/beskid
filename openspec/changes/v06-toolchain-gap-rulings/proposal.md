## Why

Two language rules were not specified, and the reference compiler did not implement the behavior that authors expect. Both defects were found while the resolver was written in Beskid.

- The spec gives no evaluation order for an index expression. The compiler read the array from the base before it evaluated the index and the assigned value. `Array.Append` can replace the array that a local or a field holds when the array grows. Thus `table.values[Grow(table)] = v`, where `Grow` appends to `table.values`, stored into the replaced array and trapped on the bounds check. The result depended on the spare capacity of the array.
- The type grammar allows an array `T[]` of any type expression `T`, but the parser accepted only one `[]`. `i64[][]` did not parse.
- The spec gives no type for an unsuffixed integer literal without a destination, and no type for a use of a module constant. The query layer typed such a literal as `i32` even when its value did not fit, so `let x = 3000000000;` stored a truncated value. It typed every constant use as `i32`, so the `LIMIT_*` runtime sentinels (`0xFFFF...`) had a wrong type fact. A constant that did not fit its destination (`i32 x = BIG;`) stopped with an internal compiler error.

## What Changes

- New rule: the operands of the base of an index expression are evaluated first, then the index, then the assigned value. The array or string is read from the base after these steps, so the read observes their side effects. A store goes into the array that the place holds at the time of the store.
- C#, Java, Kotlin and C++17 read the array reference before the index. Beskid uses a different order because a growth operation replaces the array in its owner place, while the place keeps its identity. Thus the place, not the array object, is the target of the store. This is the same result that a `List<T>` in those languages gives. The order of all calls in the expression stays left to right.
- The type grammar accepts any number of `[]` suffixes. `T[][]` is an array whose elements are `T[]`.
- New rule: an unsuffixed integer literal takes the integer type of its declared destination; without one it has its natural type (`i32`, else `i64`, else `word` for a 64-bit hexadecimal value). A literal or constant operand of a binary expression takes the type of the other operand (rule T1), with no promotion of that operand. A module constant use has the type of its declared literal at that position. A value that does not fit its type is **T0905**; the compiler never truncates it.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `language-meta--evaluation--control-flow`: adds the index expression evaluation order.
- `language-meta--type-system--types`: states that an array element type can be an array type, and gives the types of integer literals and module constant uses.

## Impact

Compiler: `beskid_isle` index read, index store and string index lowering read the base after the index and the value. `beskid_analysis` grammar (`beskid.pest`) adds the `ArraySuffix` rule for the second and later array ranks. A one-rank array `T[]` keeps its parse tree, so every existing source parses to the same tree; the grammar revision digest changes and persisted syntax artifacts are rebuilt. No program that ran before changes its result unless its index or assigned value changes the place of the base.

Compiler (integer literal types): `beskid_queries` types an unsuffixed literal and a constant use from the one syntax authority `integer_literal_primitive_type`, and the legality gate reports T0905 for a constant use at a destination it does not fit and for an inferred `let` literal without a natural integer type. A program that ran before changes its result only where it stored a truncated value.
