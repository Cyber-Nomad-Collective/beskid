# Design: dead assignment to a mutable parameter (0.6.7)

## Ruling

The standard already decides the semantics: "Parameters are passed by value" (memory and references, "Locals mut and assignment"), and the requirement "Dead growth of a mutable array parameter" (E1231) states that a change to a `mut T[]` parameter changes only the callee's copy of the handle. The Book (chapter 10, "Parameter passing") tells the reader to use return values or heap handles when the caller needs updated state. Corelib uses `mut` parameters as reassignable locals with literal arguments (`Slice.SubSlice(handle, 0_i64, count)`), which an alias parameter cannot accept.

The owner's 0.6.7 rulings agree: move semantics apply only at isolate crossings, collections mutate in place through their handle, and copy on assignment applies only to `List<T>`. None of them makes a parameter an alias of the caller's storage.

The C# comparison gives the same answer. A C# parameter without a modifier can be reassigned, and the reassignment is not visible to the caller; write-through needs `ref`. Beskid `mut T name` is the C# parameter without a modifier, and Beskid has no `ref` (not part of v0.x).

Thus a `mut` parameter is not an alias. The defect is that the compiler accepts an assignment that cannot have an effect. The fix is a compile error, not a change to the calling convention.

## Rule

A *whole assignment* is an expression statement whose expression is an assignment (`=`, `+=`, `-=`, `*=`, `/=`, `%=`) and whose target is the name of a `mut` parameter of the enclosing function or method. A *read* is any other occurrence of the parameter name: an operand, a field or element access (also as an assignment target, `p.f = v`, `p[i] = v`), a call argument, a `return` operand, a capture in a lambda, the value of a compound assignment, and an assignment that is nested in another expression.

The compiler computes, for each whole assignment, whether the parameter is live after it: whether a read can follow on a path before the parameter is assigned again or the body ends. The analysis is backward over the structured body:

| Construct | Rule |
|-----------|------|
| End of body, `return e` | The parameter is dead after them (`return e` reads `e`) |
| `break`, `continue` | Live after them as at the end, or at the head, of the innermost loop |
| `while (c) { b }` | Fixpoint: live at the head = reads of `c`, plus live at the start of `b`, plus live after the loop |
| `for x in e { b }` | `e` is read once; the body repeats as for `while` |
| `if`/`else`, `match` | Union of the branches; a `match` can end without an arm, and its guards are reads |
| `let`, `launch`, `with`, scoped `use` | Their expressions are reads; `with` and `use` bodies are blocks |
| Nested block, `match` in statement position | Statements inside are judged like the enclosing body |

A whole assignment after which the parameter is dead is **E1259**. The diagnostic points at the assignment, names the parameter, and has a related note at the parameter declaration.

## Conservative cases

The check never reports when it cannot see every read:

- A parameter whose name is declared again in the body (a `let`, a `for` iterator, a pattern binding, a lambda parameter) is not judged.
- A parameter whose name occurs in a `${ ... }` string interpolation of the body is not judged.
- A body that contains a macro invocation, a CLIF block or a code string is not judged.
- A `mut this` receiver is not judged; whole assignment to `this` is not part of the language.
- Lambda bodies are not judged; an occurrence of the parameter in a lambda is a read.

## Placement

The fact is `dead_parameter_assignments` in the legality gate (`check_items`), beside E1231 and E1258. The gate runs before specialization and lowering in `beskid build`, `beskid test` and `beskid run`, and in `beskid check` and the language server.
