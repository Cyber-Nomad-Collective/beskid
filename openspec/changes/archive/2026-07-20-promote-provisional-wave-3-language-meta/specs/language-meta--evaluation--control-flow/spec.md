## ADDED Requirements

### Requirement: Conditional and loop statement typing
`if (cond) block else block` and `while (cond) block` MUST require `cond` to be `bool`. `for id in expr block` MUST require `expr` to be iterable per type rules (v0.1: range and array-like forms as implemented). `return expr?;` MUST return from the innermost function and `expr` MUST match the return type when present.

#### Scenario: Non-bool if condition
- **GIVEN** an `if` whose condition expression is not `bool`
- **WHEN** control-flow typing runs
- **THEN** the compiler emits a non-bool condition diagnostic

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

## REMOVED Requirements

### Requirement: Control flow conformance status
**Reason**: Replaced by explicit behavioral requirements extracted from migrated source.
**Migration**: Cite the ADDED requirements above.
