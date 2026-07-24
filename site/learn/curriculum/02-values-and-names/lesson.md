# 02) Values and Names

Goal: define a value and consume it in a deterministic branch.

- Use `let` for local values.
- Keep both branches returning `i32` and preserve the `Main` entrypoint.

## Code Walkthrough

```beskid
let name = 42;
if name == 42 {
  return 0;
}
return 1;
```

Programs rarely work with literals alone — you need to name values so you can reuse them. Beskid uses `let` bindings for this, just like many modern languages.

- `let` creates a named, immutable binding
- The compiler infers the type from the right-hand side, so you don"t need to annotate `let` bindings explicitly
- Name inference is deterministic — the compiler always picks the narrowest type that fits

### Branch Convergence

Branches must converge: every path through the function must produce an `i32` value. The compiler tracks reachability and will reject functions where a path falls off the end.

### Key Takeaways

- `let` creates a named, immutable binding
- Type inference works on let bindings — no annotation needed
- Every `if` must have its paths accounted for in the return analysis

## Questions

**1. Which keyword binds a value to a local name in Beskid?**

A) `var` | B) `const` | C) `let` | D) `def`

**2. When you write `let x = 5;` without an explicit type annotation, what does the Beskid compiler do?**

A) Reports an error — type annotations are always required | B) Infers the type of `x` as `i32` from the value `5` | C) Treats `x` as a generic type until it is used | D) Defaults to `i64` for all integer literals