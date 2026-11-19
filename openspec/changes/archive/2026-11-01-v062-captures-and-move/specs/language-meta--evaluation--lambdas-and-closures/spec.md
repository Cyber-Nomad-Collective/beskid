## MODIFIED Requirements

### Requirement: Capture and closure lifetime
Captured locals MUST be definitely assigned before capture or diagnosed per definite-assignment rules. A capture SHALL be a by-value snapshot taken when the closure record is created. A lambda that is not a `spawn` operand SHALL NOT capture a `mut` binding or a native pointer; the compiler SHALL report **E1233** at the lambda and SHALL name the captured binding. A `spawn` operand that captures a stack reference SHALL keep **E1225**. A closure MUST extend the lifetime of captured storage to at least the closure value's lifetime: a captured managed value SHALL be traced through the closure environment. Closures passed to `spawn` MUST be compatible with fiber entry signatures.

A lambda that captures an owning Moved-class name without `move` SHALL borrow it: the capture is a borrow and the lambda SHALL NOT store, return, `move` or pass it to a `move` parameter (**E1241** at the escaping use). A lambda that captures `move x` SHALL consume `x` at the lambda expression; the capture is owned by the closure environment, and a lambda that is not passed to a `[Captures]` parameter or to `spawn` SHALL NOT capture `move x` (**E1239** at the `move`, noting that an ordinary closure is repeatable).

#### Scenario: Capture of mut binding rejected
- **GIVEN** `i64 Main() { mut i64 count = 1; let read = () => count; return read(); }`
- **WHEN** capture analysis runs
- **THEN** the compiler emits **E1233** at the lambda, naming `count`, and rejects the lambda

#### Scenario: Captured string is traced
- **GIVEN** `string Call((string) => string f) { return f("!"); }` and `string Main(string prefix) { return Call((string s) => prefix + s); }`
- **WHEN** the lambda's closure environment is laid out
- **THEN** `prefix` is a traced field of the environment

#### Scenario: Ordinary lambda borrows a Moved capture
- **GIVEN** `i64 Total(u8[] data) { let sum = () => Checksum(data); return sum() + sum(); }` where `Checksum(u8[] data)` takes a borrowed parameter
- **WHEN** capture analysis runs
- **THEN** the lambda compiles and `data` stays usable after the lambda

#### Scenario: Ordinary lambda may not move a capture
- **GIVEN** `unit Keep(u8[] data) { let take = () => Archive.Store(move data); take(); }`
- **WHEN** capture analysis runs
- **THEN** the compiler SHALL report **E1239** at `move data`

## ADDED Requirements

### Requirement: Capture bounds on function-typed parameters
A parameter of function type MAY carry `[Captures(Bound: C)]` where `C` is a path naming one of the corelib marker contracts `Transferable`, `Shared`, `Moved` or `Copied`. Any other `Bound` expression, or `[Captures]` on a parameter whose type is not a function type, SHALL be reported as **E1248** at the attribute. The bound SHALL be part of the callable's signature fact, visible in hover and signature help, and SHALL be honored at every call of the callable, including calls through a contract method or a function-typed value whose declaration carries it.

At a call site, the argument for a `[Captures]` parameter SHALL be one of:

1. a lambda literal: every capture SHALL have a transfer class accepted by `C` (Shared, Moved or Copied for `Transferable`; the one class otherwise). A capture whose class is rejected SHALL be reported as **E1236** at the capture, naming the binding, its type, its class and the first offending field when the class is Never. A capture of a `mut` local SHALL be reported as **E1235** at the first assignment inside the lambda, or at the capture when the lambda only reads it, with the help "use a reduction". A capture of an owning Moved-class name without `move` SHALL be reported as **E1237** at the capture with the help "write `move <name>`"; a capture written `move x` SHALL consume `x` at the lambda expression. A capture of a borrowed Moved-class name SHALL be reported as **E1241**;
2. a named, non-generic function item: accepted, because it has no environment;
3. anything else (a local, field, call result or parameter of function type): **E1238** at the argument, with the help "pass the lambda literal".

**E1235**, **E1236**, **E1237** and **E1238** SHALL be legality facts of the calling item in the query layer, reported once per capture or argument.

#### Scenario: Shared and Copied captures accepted
- **GIVEN** `pub unit Run([Captures(Bound: Transferable)] () => i64 body) { }`, `[Immutable] pub type Config { string name, i64 retries }`, `[Copyable] pub type Pixel { u8 r, u8 g, u8 b }` and `unit Main(Config config, Pixel pixel) { Run(() => config.retries + pixel.r); }`
- **WHEN** the call is checked
- **THEN** no diagnostic is reported

#### Scenario: Mutable local captured
- **GIVEN** the same `Run` and `i64 Count(List<string> lines) { mut i64 count = 0; Run(() => { count = count + 1; return count; }); return count; }`
- **WHEN** the call is checked
- **THEN** the compiler SHALL report **E1235** at `count = count + 1` with the help "use a reduction"

#### Scenario: Non-transferable capture
- **GIVEN** the same `Run`, `pub type Cache { Map<string, i64> entries }` and `unit Main(Cache cache) { Run(() => cache.entries.Count()); }`
- **WHEN** the call is checked
- **THEN** the compiler SHALL report **E1236** at `cache`, naming `Cache`, class Never and the reason "no marker attribute"

#### Scenario: Moved capture without move
- **GIVEN** the same `Run` and `unit Main(move u8[] data) { Run(() => Checksum(data)); }`
- **WHEN** the call is checked
- **THEN** the compiler SHALL report **E1237** at `data` with the help "write `move data`"

#### Scenario: Moved capture with move consumes
- **GIVEN** the same `Run` and `unit Main(move u8[] data) { Run(() => Checksum(move data)); i64 n = Array.Len<u8>(data); }`
- **WHEN** the item is checked
- **THEN** the call is accepted and `Array.Len<u8>(data)` is reported as **E1234** naming `data` and pointing at `move data`

#### Scenario: Function item accepted
- **GIVEN** the same `Run` and `i64 Work() { return 1; }` and `unit Main() { Run(Work); }`
- **WHEN** the call is checked
- **THEN** no diagnostic is reported

#### Scenario: Closure value rejected
- **GIVEN** the same `Run` and `unit Main(() => i64 body) { Run(body); }`
- **WHEN** the call is checked
- **THEN** the compiler SHALL report **E1238** at `body` with the help "pass the lambda literal"

#### Scenario: Shared bound rejects a Moved capture
- **GIVEN** `pub unit Share([Captures(Bound: Shared)] () => i64 body) { }` and `unit Main(move u8[] data) { Share(() => Checksum(move data)); }`
- **WHEN** the call is checked
- **THEN** the compiler SHALL report **E1236** at `data` naming class Moved and the bound `Shared`

#### Scenario: Bound is not a marker
- **GIVEN** `pub unit Run([Captures(Bound: Disposable)] () => i64 body) { }`
- **WHEN** the declaration is checked
- **THEN** the compiler SHALL report **E1248** at the attribute

#### Scenario: Captures on a non-function parameter
- **GIVEN** `pub unit Run([Captures(Bound: Transferable)] i64 count) { }`
- **WHEN** the declaration is checked
- **THEN** the compiler SHALL report **E1248** at the attribute
