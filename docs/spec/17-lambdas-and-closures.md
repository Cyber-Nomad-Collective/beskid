# 17. Lambdas and Closures

## Scope
This document is the canonical source for lambda and closure semantics in v0.1.

## 17.1 Lambda forms
Lambdas use `=>` and are first-class callable values.

Examples:
```beskid
let isEven = x => x % 2 == 0;
let add = (x: i32, y: i32) => x + y;
let f = x => {
    IO.Println(x.ToString());
    return x;
};
```

## 17.2 Type model
Function types use arrow syntax:
```beskid
(T1, T2) -> TOut
```

Lambdas are assignable to compatible function types.

## 17.3 Inference rules
- Lambda parameter types MAY be inferred from an expected function type.
- If no expected function type exists, parameter types MUST be explicit.
- Lambda return type is inferred from lambda body when the expected function type is known.

## 17.4 Capture and closure rules
- Non-capturing lambdas lower as plain callable values.
- Capturing lambdas are supported under non-escape constraints.
- Captured environments MUST NOT escape safe scope in v0.1.

## 17.5 Interaction with query/event features
- Query pipelines MAY accept lambda callables (`Where`, `Select` style operators).
- Event handlers MAY be lambda values if signature-compatible.
- Query/event sections should reference this document for closure semantics.

## 17.6 Diagnostics (required)
Compilation MUST diagnose:
- missing parameter types when no expected function type exists,
- incompatible lambda signature at assignment/call site,
- unsupported escaping captured environments.

## 17.7 Cross references
- Syntax examples: `docs/spec/01-lexical-and-syntax.md`
- Type grammar: `docs/spec/02-types.md`
- Inference core: `docs/spec/11-type-inference.md`
- Query contracts: `docs/standard-library/Query/Contracts.md`
- Event semantics: `docs/spec/16-events.md`
