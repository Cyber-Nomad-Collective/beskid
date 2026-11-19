## ADDED Requirements

### Requirement: Index expression evaluation order
The evaluation of an index expression `base[index]` SHALL occur in this order:

1. The operands of `base`, from left to right. A local has no operands. The operand of a field access `receiver.field` is `receiver`. The operands of an index expression are the operands of its base and then its index. Any other base, for example a call, a literal or a grouped expression, SHALL be evaluated completely in this step.
2. `index`.
3. In an assignment `base[index] = value`, `value`.
4. The read of the array or string that `base` holds. This read SHALL occur after steps 2 and 3, so it observes their side effects.
5. The bounds check, and then the read or the store of the element.

A store SHALL go into the array that `base` holds after steps 2 and 3. All calls in the expression SHALL occur from left to right.

#### Scenario: The index grows the array
- **GIVEN** `table.values[Grow(table)] = v`, where `Grow` appends one element to `table.values` and returns the index of that element
- **WHEN** the assignment executes, also when the append replaces the array of `table.values`
- **THEN** the new last element of `table.values` is `v` and no trap occurs

#### Scenario: The assigned value grows the array
- **GIVEN** a full `table.values` and `table.values[0] = Push(table, 5, 7)`, where `Push` appends `5` and returns `7`
- **WHEN** the assignment executes
- **THEN** `table.values[0]` is `7` and the last element of `table.values` is `5`

#### Scenario: The receiver is evaluated before the index
- **GIVEN** `Next().values[Count()]`, where `Next` and `Count` are calls
- **WHEN** the expression is evaluated
- **THEN** `Next` is called before `Count`
