# 03) Functions and Returns

Goal: define a typed function and call it from `Main`.

- Use explicit `i32` parameter and return types.
- Keep `return` statements in branch flow.

## Code Walkthrough

```beskid
i32 add(i32 a, i32 b) {
  return a + b;
}

i32 Main() {
  i32 sum = add(1, 2);
  if sum == 3 {
    return 0;
  }
  return 1;
}
```

Functions are the building blocks of Beskid programs. Every function must declare explicit types for its parameters and return value — there are no implicit types at function boundaries.

- `i32 add(i32 a, i32 b)` declares a function that takes two `i32` parameters and returns `i32`
- The body uses `return a + b` to compute and return the result
- In `Main`, we call `add(1, 2)` and bind the result to `sum`

### Branch Consistency

When a function contains multiple `return` statements inside branches, every branch must return the same type. The compiler enforces this to guarantee type safety at every call site.

### Key Takeaways

- Every function signature in Beskid requires explicit types for parameters AND the return type
- Branch paths must all return the same type
- Functions are called with standard C-like syntax: `functionName(args)`

## Questions

**1. What must every function signature in Beskid include?**

A) A body with at least one expression | B) Explicit types for parameters and the return type | C) The `pub` visibility modifier | D) At least two parameters

**2. When a function contains multiple `return` statements inside branches (e.g., `if`/`else`), what rule must be followed?**

A) Each branch must return a value of the same type | B) Only the last branch needs a `return` statement | C) Branches may return different types as long as one is `i32` | D) At most one `return` statement is allowed per function