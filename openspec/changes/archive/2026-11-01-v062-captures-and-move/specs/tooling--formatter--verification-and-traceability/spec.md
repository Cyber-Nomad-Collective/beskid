## ADDED Requirements

### Requirement: move forms in the formatter corpus
The representative source corpus used by the idempotency round-trip test SHALL contain a `move` expression as a call argument, as a `let` initializer and as a `return` operand, a `move` parameter, a `move this` receiver, a `mut this` receiver, a destructive read `move x.f`, an `exchange(place, move v)` call and a `[Captures(Bound: Transferable)]` parameter. The formatter SHALL emit `move` and `exchange` forms with one space after `move` and no space inside the parentheses of `exchange`, and `format_program(parse(s))` SHALL be a fixed point for every file of that corpus.

#### Scenario: move forms round-trip
- **GIVEN** the corpus file containing `pub Archive Add(move this, move u8[] block) { this.blocks = this.blocks.Push(move block); return this; }` and `return exchange(this.buffer, move next);`
- **WHEN** the file is formatted twice
- **THEN** both passes produce identical output equal to the input
