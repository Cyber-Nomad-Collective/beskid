# 01) Hello, Beskid

Goal: emit a valid program and prove it parses with `beskid analyze`.

1. Keep code inside `i32 Main()`.
2. Use an explicit return type and a deterministic return value.
3. Press **Run checks** and move on only when diagnostics are clean.

## Code Walkthrough

```beskid
i32 Main() {
  return 0;
}
```

Every Beskid program starts with a `Main` function — the entry point the compiler looks for when building your binary. Think of it as the front door to your program.

- `i32` is the return type — a 32-bit signed integer. The OS expects a numeric exit code.
- `Main()` is the function name and parameter list. Capital M is required.
- `{ return 0; }` is the body. `return 0` signals success to the operating system.

### What `beskid analyze` Does

The `analyze` command parses your code, resolves names, and type-checks every expression. It won"t produce a binary, but it confirms your program is well-formed.

### Key Takeaways

- Every Beskid program needs exactly one `Main` function
- Return types are mandatory on all functions
- `return 0` means "everything went fine"

## Questions

**1. What is the return type of the `Main` function in a Beskid program?**

A) `void` | B) `string` | C) `i32` | D) `bool`

**2. Which command verifies that a Beskid program is syntactically and semantically valid?**

A) `beskid run` | B) `beskid compile` | C) `beskid analyze` | D) `beskid fmt`

**3. What does `return 0` signal in the Main function?**

A) An error occurred | B) The program should restart | C) Successful execution | D) The compiler should optimize