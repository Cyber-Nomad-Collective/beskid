# 08. Metaprogramming

## Goals
- Provide ergonomic compile-time code generation without reflection.
- Support two macro families: simple pattern macros and AST macros.
- Keep diagnostics precise (errors point to macro use sites).

## 1) Simple macros (`macro {}`)

### Purpose
Simple macros shorten repetitive code and operate on structured syntax fragments (not raw text). They are inspired by Rust-style declarative macros but restricted to typed fragments.

### Definition
```
macro log_if {
    (cond: Expression, msg: Expression) => {
        if cond { println(msg); }
    }
}
```

### Invocation
```
log_if!(x > 0, "positive");
```

### Fragment kinds
Allowed fragment kinds (v0.1):
- `Expression`
- `Statement`
- `Block`
- `Type`
- `Identifier`
- `Path`
- `Item`

Example fragments:
```
macro wrap {
    (value: Expression) => { println(value); }
}

macro make_fn {
    (name: Identifier, body: Block) => {
        fn name() -> unit body
    }
}
```

### Repetition (v0.2)
Repetition is planned but not required for v0.1.

---

## 2) AST macros (`macro[Ast.Node] {}`)

### Purpose
AST macros transform compiler AST nodes directly. They are used via attributes and can generate or modify code at compile time.

### Definition
```
macro[Ast.FuncDecl] log_wrap {
    (fn_node) => {
        return Ast.wrap_with_logging(fn_node);
    }
}
```

### Invocation (attribute)
```
[log_wrap]
fn do_work() {
    work();
}
```

### AST types (minimal set)
The compiler exposes a typed AST API under `Ast`:
```
namespace Ast {
    type FunctionDeclaration { name: string, params: Param[], body: Block }
    type TypeDeclaration { name: string, fields: Field[] }
    type Block { statements: Statement[] }
    enum Statement { Let(...), Expression(...), Return(...) }
    enum Expression { Call(...), Binary(...), Identifier(...), Literal(...) }
}
```

---

## Expansion phase
1. Parse source into AST.
2. Expand simple macros (`macro {}`) on syntax fragments.
3. Apply AST macros (`macro[Ast.Node] {}`) on attributed nodes.
4. Proceed to type checking.

## Decisions
- Macro expansion happens before name resolution.
- Macros cannot introduce new `type` or `contract` declarations in v0.1.
- Expansion is bounded by a compiler-defined step budget.

Example (expansion before name resolution):
```
macro use_name { () => { let x = 1; } }
use_name!();
```

## Restrictions (v0.1)
- No reflection.
- No I/O during macro expansion.
- Deterministic expansion (no random/time-dependent behavior).

Example (disallowed):
```
macro read_file { () => { /* file IO */ } }
```

## Diagnostics
- Errors inside macro expansions should point to the macro invocation site where possible.
