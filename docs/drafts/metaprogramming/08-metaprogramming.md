# 08. Metaprogramming

## Goals
- Provide ergonomic compile-time code generation without Rust-style procedural macros.
- Preserve IDE responsiveness via incremental scheduling.
- Keep declarations strongly typed and queryable in AST/HIR.
- Keep diagnostics precise and local to attribute or generator sites.

## Status (v0.1)

### Implemented in current refactor track
1. **First-class attribute declarations**
2. **Typed expression arguments in attribute applications**
3. **Attributes stay in active language scope (not removed from core spec)**

### Planned next (generator phase)
1. `generator {}` declarative blocks
2. Incremental generator execution based on target/predicate hashes
3. Declarative source emission and compile-time diagnostics from generators

## 1) Attribute model (implemented + extension track)

### 1.1 Attribute declarations
Attributes are declared explicitly at top-level:

```beskid
pub attribute Builder(TypeDeclaration, MethodDeclaration) {
    suffix: string = "Builder",
    enabled: bool = true,
}
```

The optional target list on declaration name constrains where an attribute can be applied.
This keeps placement policy near declaration and avoids a separate `targets` keyword.

### 1.2 Attribute applications
Attributes are applied with named, typed expression arguments:

```beskid
[Builder(suffix: "Factory", enabled: false)]
type User {
    string name,
}
```

### 1.3 Binding rules
- Attribute application name resolves against declared attributes.
- Argument names must match declared parameters.
- Missing required parameters are errors.
- Duplicate arguments are errors.
- Argument expression type must match parameter type.
- If declaration target list exists, application target kind must be included.

### 1.4 Extern compatibility path
`[Extern(Abi: "C", Library: "libc")]` remains supported.

Internally, extern lowering now consumes typed expression arguments and extracts compile-time string literals for ABI metadata.

### 1.5 Canonical attribute targets (v0.1+)
- `TypeDeclaration`
- `EnumDeclaration`
- `ContractDeclaration`
- `ModuleDeclaration`
- `FunctionDeclaration`
- `MethodDeclaration`
- `FieldDeclaration`
- `ParameterDeclaration`

### 1.6 Shared attachment model (AST/HIR)
To keep implementation DRY and consistent, attribute storage should be unified across attributable nodes:
- Syntax layer: every attributable node exposes the same `attributes` collection shape.
- HIR layer: every attributable node lowers into a shared attribute container shape.
- Semantic layer: a single legality path validates declaration existence, target compatibility, and argument typing.

See implementation breakdown in `docs/drafts/metaprogramming/attribute-implementation-plan.md`.

## 2) Generator model (planned, post-attribute stabilization)

Generators use a dedicated declarative syntax with filtering outside generation body (no `generate` method):

```beskid
generator {
    for type t
    where t.HasAttribute("Builder")

    emit type ${t.name}Builder {
        // generated members
    }
}
```

### 2.1 Design constraints
- Selection/filtering lives in header clauses (`for` + `where`).
- Generation body contains only declarative actions (`emit`, `diagnostic`).
- Generators are deterministic and side-effect free in v0.1.

### 2.2 Incremental scheduling contract
A generator unit reruns only when one of these changes:
- generator source hash,
- selected target semantic hash,
- attribute argument values consumed by predicate/body.

Unrelated edits must not trigger reruns.

## 3) Compiler pipeline contract
1. Parse sources.
2. Parse + validate attribute declarations.
3. Bind attribute applications to declarations.
4. (Planned) plan generator target sets.
5. (Planned) execute only affected generator-target pairs.
6. Merge generated AST.
7. Continue normal semantic pipeline.

## 4) Diagnostics contract

Required diagnostics in metaprogramming surface:
- unknown attribute,
- unknown argument name,
- missing required argument,
- duplicate argument,
- argument type mismatch.

(Planned) generator diagnostics must preserve both generator location and target-site context.

## 5) Non-goals and restrictions (v0.1)
- No runtime reflection-based metaprogramming.
- No generator filesystem/network effects.
- Append-only generation (no in-place mutation of existing nodes).
