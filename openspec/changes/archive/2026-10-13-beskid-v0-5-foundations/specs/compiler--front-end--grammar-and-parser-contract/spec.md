## ADDED Requirements

### Requirement: Spawn is a bindable expression with capture syntax
The grammar SHALL parse `spawn` as an expression usable in a typed binding, including `Fiber<T> name = spawn Callable(args);` and `Fiber<T> name = spawn () => { return captured; };`. In the latter form, `captured` is captured from the enclosing lexical scope by the standard lambda capture model. The syntax tree MUST preserve whether the source used a call or lambda block and MUST preserve the lambda body, captures, and source spans. A discarded statement-form spawn MUST remain distinguishable so semantic analysis can diagnose it.

**Stable ID:** `BSP-REQ-6DA154A4738C`

#### Scenario: Typed spawn binding parses
- **GIVEN** `Fiber<i64> f = spawn Compute();`
- **WHEN** the reference parser builds its syntax tree
- **THEN** the initializer is a spawn-expression node with a callable target and the declared binding remains `Fiber<i64>`

#### Scenario: Spawned lambda retains capture metadata
- **GIVEN** `i64 captured = 7; Fiber<i64> f = spawn () => { return captured; };`
- **WHEN** the reference parser builds its syntax tree
- **THEN** the node retains the lambda block body, the lexical capture `captured`, and its source span

### Requirement: Scoped use binding has a dedicated grammar form
The grammar SHALL parse `use Type name = expression;` and its optional scoped block form as a dedicated scoped-binding node. It MUST NOT parse this form as an import, alias `using`, or unrestricted declaration, and malformed forms without a binding, initializer, or required scope delimiter MUST produce a parser diagnostic.

**Stable ID:** `BSP-REQ-49672AF267D1`

#### Scenario: Scoped resource binding parses
- **GIVEN** `use TestResource resource = input;`
- **WHEN** the reference parser builds its syntax tree
- **THEN** it produces a scoped-binding node with type `TestResource`, name `resource`, and initializer `input`
