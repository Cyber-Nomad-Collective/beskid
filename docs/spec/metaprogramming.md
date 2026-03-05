# Metaprogramming (Incremental)

## Scope
This spec defines the first formal metaprogramming contract for v0.x:
1. first-class attribute declarations,
2. typed attribute application arguments,
3. incremental generator scheduling model.

## 15.1 Attribute declarations
Attributes are top-level declarations with typed parameters and optional defaults.

```beskid
attribute Builder {
    suffix: string = "Builder",
    enabled: bool = true,
}
```

Rules:
- attribute declarations are resolved symbols,
- parameter names are unique,
- defaults must be type-compatible constants.

## 15.2 Attribute applications
Applications bind named arguments to declared parameters.

```beskid
[Builder(suffix: "Factory", enabled: false)]
type User { string name }
```

Validation:
- unknown attribute declaration: error,
- unknown argument name: error,
- duplicate argument assignment: error,
- missing required argument (no default): error,
- type mismatch between argument expression and parameter type: error.

## 15.3 Extern compatibility (reference)
`Extern` language syntax, typing, and diagnostics are canonical in:
- `docs/spec/ffi-and-extern.md`

This chapter only defines metaprogramming attribute declaration/application behavior.

## 15.4 Generator block model (planned)
Generator syntax is declarative and incremental.

```beskid
generator {
    for type t
    where t.HasAttribute("Builder")
    emit type ${t.name}Builder { }
}
```

Contract:
- generator execution is side-effect free relative to filesystem/network,
- rerun triggers are based on generator source + selected target semantic hashes,
- unrelated node edits must not rerun unaffected generators.

## 15.5 Pipeline placement
Metaprogramming runs between parse and full semantic typing:
1. parse source,
2. resolve attribute declarations,
3. bind applications,
4. evaluate generator selection + emissions,
5. merge generated items,
6. continue resolution/typing/lowering.

## 15.6 Non-goals
- runtime reflection,
- arbitrary side-effecting macro execution,
- network/filesystem access from generator bodies.
