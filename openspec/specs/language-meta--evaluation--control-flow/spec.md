<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# Control flow Specification

## Purpose

This specification defines conditionals, loops, and structured control transfer. The lowering to HIR and CLIF follows the evaluation order defined here.
## Requirements
### Requirement: Conditional and loop statement typing
`if (cond) block else block` and `while (cond) block` MUST require `cond` to be `bool`. `for id in expr block` MUST require `expr` to be iterable: the built-in `range(start, end)` form, a value whose type is an array `T[]`, or a nominal value whose type declares the iterator protocol (`Option<T> Next()`); any other iterable is **E1215**. The iterator protocol is satisfied when the iterable's nominal type declares exactly one `Next` method, with no parameters, that returns an `Option<T>` whose variants are `Some` with one payload and `None` without one. Outside a generic or contract-parameterized item, a non-`range` iterable that is not proven to be an array or a nominal iterator is **E1215**, so `beskid check` accepts exactly the loops `beskid build` lowers. `return expr?;` MUST return from the innermost function and `expr` MUST match the return type when present.

#### Scenario: Non-bool if condition
- **GIVEN** an `if` whose condition expression is not `bool`
- **WHEN** control-flow typing runs
- **THEN** the compiler emits a non-bool condition diagnostic

#### Scenario: Nominal iterator loop builds
- **GIVEN** a nominal type that declares `Option<i64> Next()` and a `for item in source { }` loop over a local `source` of that type
- **WHEN** `beskid check` judges the loop and `beskid build` lowers it
- **THEN** `beskid check` SHALL NOT report **E1215**
- **AND** `beskid build` SHALL lower the loop without a compiler gap

#### Scenario: Next returns an Option without the Some and None variants
- **GIVEN** `pub enum Option<T> { Present(T value), Absent }`, a type `Odd` that declares `pub Option<i64> Next()`, and `unit Main(Odd odd) { for x in odd { return; } return; }`
- **WHEN** control-flow typing runs
- **THEN** the compiler SHALL report **E1215** at the iterable

#### Scenario: For over a non-iterable value
- **GIVEN** `unit Main(i64 n) { for i in n { return; } return; }`
- **WHEN** control-flow typing runs
- **THEN** the compiler SHALL report **E1215** at the iterable

### Requirement: Break continue and evaluation order
`break;` and `continue;` MUST appear inside a loop; otherwise the compiler MUST emit **E1401** / **E1402**. Function arguments MUST be evaluated left to right before the call. Binary operators `&&` and `||` MUST evaluate the left operand before the right with short-circuit semantics. Assignment MUST evaluate the right-hand side before storing. `break` MUST exit the innermost `while`/`for`; `continue` MUST jump to the next iteration.

#### Scenario: Break outside loop
- **GIVEN** a `break;` statement that is not nested in a `while` or `for`
- **WHEN** control-flow checking runs
- **THEN** the compiler emits **E1401**

### Requirement: Control-flow HIR normalization
HIR lowering MUST normalize control flow graphs (**E1154** if non-normalized). Unreachable code after unconditional transfer MAY warn (**W1403**). L3 semantic tests for break/continue and return paths MUST pass.

#### Scenario: Non-normalized control-flow graph
- **GIVEN** HIR that fails control-flow normalization
- **WHEN** lowering validates the CFG
- **THEN** the compiler emits **E1154**

### Requirement: Definite return
A function or method whose declared result is not `unit` or `never` SHALL NOT have a reachable end of body. Every path through the body SHALL end in `return <value>;` or in a statement that does not complete normally. The compiler SHALL report **E1258** for a body whose end is reachable, before lowering.

A statement SHALL complete normally except as follows:
- `return`, `break` and `continue` SHALL NOT complete normally. A reachable `break` SHALL make the end of its innermost loop reachable.
- A `while` statement SHALL NOT complete normally when its condition is the literal `true`, with or without grouping parentheses, and its body has no reachable `break` for that loop. The compiler SHALL NOT evaluate other loop conditions.
- An `if` statement without `else` SHALL complete normally, whatever its condition. An `if` statement with `else` SHALL complete normally when at least one of its branches completes normally.
- A `with` statement, a scoped `use` statement with a block, and a nested block SHALL complete normally when their statements complete normally.
- A `match` statement SHALL NOT complete normally when no arm body completes normally and the match cannot end without taking an arm: a match on an enum value, or a match on a primitive value with an unguarded `_` or binding arm.
- A call statement whose result type is `never` SHALL NOT complete normally.

`for`, `let` and `launch` statements, and all other expression statements, SHALL complete normally. Statements after a statement that does not complete normally SHALL NOT make the end of the body reachable. The rule SHALL apply in the same way to functions with `[Export]`, Mod and SDK callbacks, and methods.

#### Scenario: Expression statement at the end of a valued function
- **GIVEN** `i32 Main() { 0; }`
- **WHEN** the code is checked or built
- **THEN** the compiler SHALL report **E1258** at the closing brace of `Main`, and the build SHALL NOT report an internal error

#### Scenario: If without else
- **GIVEN** `i32 Sign(bool positive) { if (positive) { return 1; } }`
- **WHEN** the code is checked
- **THEN** the compiler SHALL report **E1258**

#### Scenario: If and else both return
- **GIVEN** `i32 Sign(bool positive) { if (positive) { return 1; } else { return -1; } }`
- **WHEN** the code is checked
- **THEN** the compiler SHALL NOT report **E1258**

#### Scenario: Formatted infinite loop
- **GIVEN** `i32 Wait(i32 limit) { mut i32 count = 0; while (true) { if (count >= limit) { return count; } count = count + 1; } }`
- **WHEN** the code is checked
- **THEN** the compiler SHALL NOT report **E1258**

#### Scenario: Infinite loop with a break
- **GIVEN** `i32 Stop() { while (true) { break; } }`
- **WHEN** the code is checked
- **THEN** the compiler SHALL report **E1258**

#### Scenario: Enum match whose arms return
- **GIVEN** `enum Step { Stop(), Go(i32 value) }` and `i32 Next(Step step) { match step { Step::Stop() => { return 0; }, Step::Go(value) => { return value; }, } }`
- **WHEN** the code is checked
- **THEN** the compiler SHALL NOT report **E1258**

#### Scenario: Primitive match without a catch-all arm
- **GIVEN** `i32 Pick(i32 code) { match code { 1 => { return 10; }, 2 => { return 20; }, } }`
- **WHEN** the code is checked
- **THEN** the compiler SHALL report **E1258**

#### Scenario: Call that returns never
- **GIVEN** `never Halt() { while (true) { } }` and `i32 Main() { Halt(); }`
- **WHEN** the code is checked
- **THEN** the compiler SHALL NOT report **E1258**

### Requirement: Conditional expression evaluation and typing
In `cond ? a : b`, `cond` SHALL have type `bool`; any other type SHALL be reported with **E1208**, the non-`bool` condition diagnostic. The branches `a` and `b` SHALL have exactly the same type, and that type SHALL be the type of the expression. The compiler SHALL NOT widen or convert a typed value to make the types equal. A bare numeric literal without a suffix in one branch SHALL take the type of the other branch; when the conditional has an expected type, both branches take it. Hence `c ? 1 : 2_i64` has type `i64`. When the expected type is a contract, each branch SHALL convert to that contract and the conditional SHALL have the contract type (see `v067-contract-dispatch`). Unequal types SHALL be reported with **E1206** at the second branch, with both branches as related locations labelled "this branch is `T`". No new code is allocated. The runtime SHALL evaluate `cond` first and then exactly one branch. The branch that is not chosen SHALL NOT be evaluated, so its side effects and traps SHALL NOT occur.

#### Scenario: Chosen branch only
- **GIVEN** `i64 v = ok ? 1 : Fail();` where `Fail` traps and `ok` is `true`
- **WHEN** the code runs
- **THEN** `v` is 1 and `Fail` is not called

#### Scenario: Bare literal takes the other branch type
- **GIVEN** `let v = c ? 1 : 2_i64;`
- **WHEN** the code is checked
- **THEN** `v` has type `i64` and no diagnostic is reported

#### Scenario: Typed values do not widen
- **GIVEN** `let v = c ? a : b;` where `a` is `i32` and `b` is `i64`
- **WHEN** the code is checked
- **THEN** the compiler SHALL report the type-mismatch diagnostic at `b`

#### Scenario: Branch types differ
- **GIVEN** `let v = flag ? 1 : "one";`
- **WHEN** the code is checked
- **THEN** the compiler SHALL report a type mismatch at `"one"`

#### Scenario: Condition is not bool
- **GIVEN** `let v = 3 ? 1 : 2;`
- **WHEN** the code is checked
- **THEN** the compiler SHALL report the non-`bool` condition diagnostic at `3`

### Requirement: Array iteration
`for id in expr block` where `expr` has type `T[]` SHALL evaluate `expr` exactly once, before the first iteration, to an array value; a null array value SHALL trap as an out-of-bounds access does. The loop SHALL run one iteration per index from `0` to the array's length (exclusive), in increasing order; at the start of each iteration `id` SHALL be bound to the element at the current index, read from the array value evaluated at loop entry. `id` SHALL have type `T` and SHALL be immutable (assigning it is **E1214**). Stores into not-yet-visited elements of the same array value SHALL be observed by later iterations (arrays are reference values); rebinding the local that named the iterable SHALL NOT change the iteration. `break` and `continue` SHALL target the loop. When `T` is a managed type the loop variable SHALL be a garbage-collector root for the duration of its iteration.

#### Scenario: Summing an array parameter
- **GIVEN** `i64 Sum(i64[] values) { mut i64 total = 0_i64; for value in values { total = total + value; } return total; }`
- **WHEN** the program is built and `Sum([1_i64, 2_i64, 3_i64])` runs
- **THEN** the compiler SHALL accept the program without a diagnostic
- **AND** the call SHALL return `6`

#### Scenario: Managed elements
- **GIVEN** `string Last(string[] names) { mut string last = ""; for name in names { last = name; } return last; }`
- **WHEN** the program is built
- **THEN** the loop variable `name` SHALL be a rooted managed local for each iteration
- **AND** `Last(["a", "b"])` SHALL return `"b"`

#### Scenario: Assigning the loop variable
- **GIVEN** `unit Main(i64[] values) { for value in values { value = 1_i64; } return; }`
- **WHEN** `beskid check` judges `Main`
- **THEN** the compiler SHALL report **E1214** at the assignment

### Requirement: Nominal iterator iteration
`for id in expr block` where the type of `expr` satisfies the iterator protocol with `Option<T> Next()` SHALL evaluate `expr` exactly once, before the first iteration, to an iterator value; a null iterator value SHALL trap. Before each iteration the loop SHALL call `Next()` on that iterator value: when it returns `None` the loop SHALL end, and when it returns `Some(v)` `id` SHALL be bound to `v` for that iteration. `id` SHALL have type `T` and SHALL be immutable (assigning it is **E1214**). `continue` SHALL proceed to the next `Next()` call and `break` SHALL end the loop without calling `Next()` again. The iterator value SHALL be a garbage-collector root for the whole loop, and when `T` is a managed type the loop variable SHALL be a garbage-collector root for the duration of its iteration. A generic iterator type binds its type parameters from the iterable's type; inside a generic or contract-parameterized item the protocol is resolved for each specialization.

#### Scenario: Break and continue over an iterator
- **GIVEN** a type `Counter` whose `Option<i64> Next()` yields `1` to `9` and then `None`, and a loop `for value in counter { if value == 2_i64 { continue; } if value == 5_i64 { break; } total = total + value; }`
- **WHEN** the program is built and the loop runs with `total` starting at `0`
- **THEN** the compiler SHALL accept the program without a diagnostic
- **AND** `total` SHALL be `8`

#### Scenario: Generic iterator with managed elements
- **GIVEN** `pub type Repeat<T> { T value; i64 left; pub Option<T> Next() { ... } }` and a loop over a `Repeat<Cell>` value whose body forces a garbage collection and then reads `cell.value`
- **WHEN** the program is built and the loop runs
- **THEN** `Next` SHALL be specialized for `Repeat<Cell>`
- **AND** each `Cell` the loop variable holds SHALL survive the collection

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

## Informative Source Provenance

The records below preserve migration history. They are not normative except where text was extracted into a requirement above.

### Source Record: Control flow

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/language-meta/evaluation/control-flow/`  
**Source:** `site/spec-content/platform-spec/language-meta/evaluation/control-flow/content.md`  
**SHA-256:** `15c7154b9e99843b18d9a524b49f6469f44277f1b04aa84104cd7a24372028ae`

<details>
<summary>Migrated source text</summary>

``````markdown
## Normative specification

### Scope

Defines **statement-level control flow** and structured transfer. Expression-level `match` is in [Enums and match](/platform-spec/language-meta/type-system/enums-and-match/).

### Statements

| Construct | Rule |
| --- | --- |
| **`if (cond) block else block`** | `cond` **must** be `bool` (**non-bool condition** diagnostic) |
| **`while (cond) block`** | `cond` **must** be `bool`; body may loop |
| **`for id in expr block`** | `expr` **must** be iterable per type rules (v0.1: range and array-like forms as implemented) |
| **`return expr?;`** | Returns from the innermost function; `expr` **must** match return type when present |
| **`break;` / `continue;`** | **Must** appear inside a loop; otherwise **E1401** / **E1402** |
| **`let` / typed `let`** | Introduces locals; see [Type inference](/platform-spec/language-meta/type-system/type-inference/) |

### Evaluation order

- Function arguments **must** be evaluated left to right before the call.
- Binary operators **must** evaluate left operand before right for `&&` and `||` with short-circuit semantics.
- Assignment **must** evaluate the right-hand side before storing.

### Static rules

- Unreachable code after unconditional transfer **may** warn (**W1403**).
- HIR lowering **must** normalize control flow graphs (**E1154** if non-normalized).

### Dynamic semantics

- `if` and `while` execute the taken branch block sequentially.
- `break` exits the innermost `while`/`for`; `continue` jumps to the next iteration.

### Diagnostics

Control band **E1401–E1403**; bool condition errors in type band. Registry: [Diagnostic code registry](/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/).

### Conformance

**L3** semantic tests for break/continue and return paths **must** pass.

## Decisions
<!-- spec:generate:adr-index -->
No ADRs published under **`adr/`** yet.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Control flow - Contracts and edge cases](./articles/contracts-and-edge-cases/)
- [Control flow - Design model](./articles/design-model/)
- [Control flow - Examples](./articles/examples/)
- [Control flow - FAQ and troubleshooting](./articles/faq-and-troubleshooting/)
- [Control flow - Flow and algorithm](./articles/flow-and-algorithm/)
- [Control flow - Verification and traceability](./articles/verification-and-traceability/)
<!-- /spec:generate:article-index -->
``````

</details>

### Source Record: Control flow - Contracts and edge cases

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/language-meta/evaluation/control-flow/articles/contracts-and-edge-cases/`  
**Source:** `site/spec-content/platform-spec/language-meta/evaluation/control-flow/articles/contracts-and-edge-cases/content.md`  
**SHA-256:** `59ac0abff8b8a0f55c841680458c0975d3291203b73bd1a1bb3b9fba2d2fb9a1`

<details>
<summary>Migrated source text</summary>

``````markdown
## Hard requirements

- **No `switch` statement** — Sum-type branching uses `match` expressions only.
- **Short-circuit booleans** — `&&` and `||` are mandatory short-circuit operators.
- **`bool` conditions only** — `if`/`while` must not treat non-bool values as truthy.
- **Structured transfer only** — `goto` is not in the grammar; use `break`/`continue`/`return`.

## Diagnostic band E14xx

| Code | Condition |
| --- | --- |
| **E1401** | `break` outside loop |
| **E1402** | `continue` outside loop |
| **W1403** | Unreachable code after unconditional transfer |

## Edge cases

- **Nested loops** — `break` and `continue` target the innermost enclosing loop. There is no labeled break in v0.1.
- **Return in lambda** — `return` inside a lambda returns from the lambda, not the enclosing function.
- **Unreachable after panic** — Code after a non-returning call (for example `panic`) is unreachable; **W1403** applies.
- **Empty loop body** — `while (cond) { }` is valid; the condition is re-evaluated each iteration.

## Invariants

- Every function body must normalize to a valid control flow graph without irreducible loops.
- `break` and `continue` must not appear in HIR after normalization unless inside a loop.
- The compiler must preserve short-circuit semantics for `&&` and `||` through all optimization levels.
``````

</details>

### Source Record: Control flow - Design model

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/language-meta/evaluation/control-flow/articles/design-model/`  
**Source:** `site/spec-content/platform-spec/language-meta/evaluation/control-flow/articles/design-model/content.md`  
**SHA-256:** `367483290a3eed6a2278f1bb79411f318d3d4a2d0fcf7f4e3c2a6d3c17670142`

<details>
<summary>Migrated source text</summary>

``````markdown
## Vocabulary

| Construct | Role |
| --- | --- |
| **`IfStatement`** | Conditional branch with mandatory `bool` condition |
| **`WhileStatement`** | Loop with pre-condition check |
| **`ForStatement`** | Iterator-driven loop (`for id in expr`) |
| **`ReturnStatement`** | Function exit with optional expression |
| **`BreakStatement`** | Exit innermost loop |
| **`ContinueStatement`** | Skip to next loop iteration |

## Control flow architecture

Control flow is **structured** — there is no `goto`. The compiler normalizes all control flow into a standard form during HIR lowering.

```mermaid
flowchart LR
    parse[parse statements]
    collect[collect definitions]
    control[control_flow.rs]
    normalize[HIR normalize]
    lower[lower to CLIF]
    parse --> collect --> control --> normalize --> lower
```

### Subsystem boundaries

| Subsystem | Responsibility | Key file |
| --- | --- | --- |
| Parser | Parse `if`, `while`, `for`, `return`, `break`, `continue` | `syntax/statements/` |
| AST | Store statement structure | `syntax/statements/statement.rs` |
| Control flow rules | Validate loop nesting, exhaustiveness | `analysis/rules/staged/control_flow.rs` |
| HIR normalize | Flatten to basic blocks | `hir/normalize/statements/` |
| Codegen | Emit branch instructions | `beskid_codegen` |

## Structured transfer only

`break` and `continue` must appear inside a loop. The compiler tracks loop nesting depth during semantic analysis and emits **E1401** or **E1402** for violations.

## Evaluation order

- Function arguments evaluate left to right before the call.
- Binary operators `&&` and `||` evaluate left operand before right with short-circuit semantics.
- Assignment evaluates the right-hand side before storing.
``````

</details>

### Source Record: Control flow - Examples

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/language-meta/evaluation/control-flow/articles/examples/`  
**Source:** `site/spec-content/platform-spec/language-meta/evaluation/control-flow/articles/examples/content.md`  
**SHA-256:** `2c1f67ef71174573f029302e035d6524d8f3bb2a9139ecf97a2181a4055f118c`

<details>
<summary>Migrated source text</summary>

``````markdown
## Conditional

```beskid
unit Check(i32 value) {
    if (value > 0) {
        Console.WriteLine("positive");
    } else {
        Console.WriteLine("non-positive");
    }
}
```

## While loop

```beskid
unit Countdown(i32 start) {
    while (start > 0) {
        Console.WriteLine(start);
        start -= 1;
    }
}
```

## For loop

```beskid
unit Sum(i32[] values) {
    let total = 0;
    for v in values {
        total += v;
    }
    Console.WriteLine(total);
}
```

## Break and continue

```beskid
unit Find(i32[] values, i32 target) {
    for v in values {
        if (v == target) {
            Console.WriteLine("found");
            break;
        }
        if (v < 0) {
            continue;
        }
        Console.WriteLine(v);
    }
}
```

## Return

```beskid
unit Max(i32 a, i32 b) -> i32 {
    if (a > b) {
        return a;
    }
    return b;
}
```
``````

</details>

### Source Record: Control flow - FAQ and troubleshooting

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/language-meta/evaluation/control-flow/articles/faq-and-troubleshooting/`  
**Source:** `site/spec-content/platform-spec/language-meta/evaluation/control-flow/articles/faq-and-troubleshooting/content.md`  
**SHA-256:** `3ad90469acc18b5c462c9fe7f817f477e0f449e3dcce0ce9bbba6b59c51415a6`

<details>
<summary>Migrated source text</summary>

``````markdown
## Locked decisions

| Decision | ID | Summary |
| --- | --- | --- |
| No `switch` | D-LM-CF-001 | Use `match` expressions for sum-type branching |
| Short-circuit booleans | D-LM-CF-002 | `&&` and `||` are mandatory short-circuit |
| `bool` conditions only | D-LM-CF-003 | No C-style truthiness |
| Structured transfer only | D-LM-CF-004 | No `goto`; use `break`/`continue`/`return` |

## FAQ

### Why no `switch`?

Beskid uses `match` expressions for sum-type branching, which are exhaustive and type-safe. A separate `switch` statement would duplicate functionality.

### Can I use `break` in a `for` loop?

Yes. `break` exits the innermost enclosing loop, whether `while` or `for`.

### Is there a `do...while` loop?

No. Use `while` or `for` only.

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| **E1208** | `if` or `while` condition is not `bool` |
| **E1401** | `break` outside any loop |
| **E1402** | `continue` outside any loop |
| **W1403** | Code after `return`, `break`, or `continue` |
| **E1215** | `for` target is not iterable |
``````

</details>

### Source Record: Control flow - Flow and algorithm

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/language-meta/evaluation/control-flow/articles/flow-and-algorithm/`  
**Source:** `site/spec-content/platform-spec/language-meta/evaluation/control-flow/articles/flow-and-algorithm/content.md`  
**SHA-256:** `4b85f2198e7da7677c317e0031c09ca76e52c25f6d18e6e264db8ae55a499d07`

<details>
<summary>Migrated source text</summary>

``````markdown
## Compile pipeline placement

```mermaid
flowchart LR
    parse[parse]
    resolve[resolve]
    typecheck[type check]
    control[control_flow.rs]
    normalize[HIR normalize]
    lower[lower]
    parse --> resolve --> typecheck --> control --> normalize --> lower
```

## Control flow validation algorithm (normative)

1. **Parse statements** — `IfStatement`, `WhileStatement`, `ForStatement`, `ReturnStatement`, `BreakStatement`, `ContinueStatement` become AST nodes.
2. **Type-check conditions** — `if` and `while` conditions must be `bool`; `TypeNonBoolCondition` (**E1208**) otherwise.
3. **Check `for` iterability** — The `for` iterable must implement the iterable protocol; `TypeNonIterableForTarget` (**E1215**) otherwise.
4. **Validate loop nesting** — Track loop depth with a `HirWalker`. `BreakOutsideLoop` (**E1401**) and `ContinueOutsideLoop` (**E1402**) fire when transfer statements appear outside any loop.
5. **Check return paths** — Verify that `return` expressions match the function's declared return type; `TypeReturnMismatch` (**E1207**) otherwise.
6. **Detect unreachable code** — After unconditional `return`, `break`, or `continue`, subsequent statements are unreachable; `UnreachableCode` (**W1403**) warns.
7. **Normalize HIR** — Convert structured control flow to a graph of basic blocks. `NonNormalizedHirControlFlow` (**E1154**) fires if normalization fails.

## `for` loop lowering

The `for` statement desugars to iterator protocol calls:
1. Evaluate the iterable expression.
2. Call `Next()` on the iterator.
3. Check if the result is `Option.Some`.
4. Bind the payload to the loop variable.
5. Execute the body.
6. Repeat from step 2.

## HIR normalization

```mermaid
flowchart TB
    ifstmt[if (cond) { A } else { B }]
    block1[Block: evaluate cond]
    block2[Block: branch to A or B]
    block3[Block: A body]
    block4[Block: B body]
    block5[Block: merge]
    ifstmt --> block1 --> block2 --> block3 --> block5
    block2 --> block4 --> block5
```

## LSP / incremental

Re-run control flow analysis when statement structures, loop nesting, or return paths change.
``````

</details>

### Source Record: Control flow - Verification and traceability

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/language-meta/evaluation/control-flow/articles/verification-and-traceability/`  
**Source:** `site/spec-content/platform-spec/language-meta/evaluation/control-flow/articles/verification-and-traceability/content.md`  
**SHA-256:** `0ffe13453830d2a5cb7b5951b74be5b5f8441945fd16b16bc00d162b03485fd8`

<details>
<summary>Migrated source text</summary>

``````markdown
## Verification matrix

| Scenario | Expected evidence |
| --- | --- |
| `if` with `bool` | Compiles; no diagnostic |
| `if` with non-bool | **E1208** emitted |
| `while` loop | Compiles; condition checked each iteration |
| `for` over array | Compiles; iterator protocol used |
| `break` inside loop | Compiles; exits innermost loop |
| `break` outside loop | **E1401** emitted |
| `continue` outside loop | **E1402** emitted |
| Unreachable code | **W1403** warned |

## Implementation checklist

- [x] Grammar: `if`, `while`, `for`, `return`, `break`, `continue`
- [x] AST: `IfStatement`, `WhileStatement`, `ForStatement`, `ReturnStatement`, `BreakStatement`, `ContinueStatement`
- [x] Parser: `beskid.pest` productions for all control forms
- [x] Type checker: `bool` condition validation
- [x] Control flow rules: loop nesting, unreachable code
- [x] HIR normalization: basic block conversion
- [x] Diagnostics: **E1401**, **E1402**, **W1403**, **E1208**
- [ ] Iterator protocol full specification
- [ ] `for` desugar lowering tests

## Test locations

- `compiler/crates/beskid_analysis/src/analysis/rules/staged/control_flow.rs` — control flow tests
- `compiler/crates/beskid_analysis/src/hir/normalize/statements/` — HIR normalization tests
- `compiler/crates/beskid_tests` — integration tests for control flow
``````

</details>
