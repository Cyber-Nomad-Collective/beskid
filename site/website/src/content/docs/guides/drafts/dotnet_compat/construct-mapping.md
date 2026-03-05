---
title: "Construct Mapping"
---


This document specifies how C# statements, expressions, and control flow constructs map to Beskid equivalents.

## 2.1 Variable declarations

### Local variables

| C# | Beskid |
|---|---|
| `var x = 1;` | `let x = 1;` |
| `int x = 1;` | `i32 x = 1;` |
| `int x;` (uninitialized) | Error: Beskid requires initialization |
| `const int X = 1;` | `let X = 1;` |

### Mutability

C# variables are mutable by default. Beskid variables are immutable by default. The transpiler performs a **mutation analysis pass**: if a variable is never reassigned after declaration, it emits `let`. If it is reassigned, it emits `TypeName mut`.

#### C# input
```csharp
int count = 0;
count += 1;
string name = "Ada";
Console.WriteLine(name);
```

#### Beskid output
```beskid
i32 mut count = 0;
count = count + 1;
let name = "Ada";
Std.IO.Println(name);
```

## 2.2 Operators

### Arithmetic

| C# | Beskid | Notes |
|---|---|---|
| `a + b` | `a + b` | 1:1 |
| `a - b` | `a - b` | 1:1 |
| `a * b` | `a * b` | 1:1 |
| `a / b` | `a / b` | 1:1 |
| `a % b` | `a % b` | 1:1 |

### Compound assignment

| C# | Beskid |
|---|---|
| `x += 1` | `x = x + 1` |
| `x -= 1` | `x = x - 1` |
| `x *= 2` | `x = x * 2` |
| `x /= 2` | `x = x / 2` |
| `x++` | `x = x + 1` |
| `x--` | `x = x - 1` |
| `++x` | `x = x + 1` (value-returning context: emit temp variable) |

### Comparison

| C# | Beskid |
|---|---|
| `a == b` | `a == b` |
| `a != b` | `a != b` |
| `a < b` | `a < b` |
| `a > b` | `a > b` |
| `a <= b` | `a <= b` |
| `a >= b` | `a >= b` |

### Logical

| C# | Beskid |
|---|---|
| `a && b` | `a && b` |
| `a \|\| b` | `a \|\| b` |
| `!a` | `!a` |

### Bitwise

Unsupported in v0.1 unless Beskid adds bitwise operators. Emit error.

### String concatenation

| C# | Beskid |
|---|---|
| `"hello " + name` | `"hello ${name}"` |
| `$"hello {name}"` | `"hello ${name}"` |
| `$"count: {x + 1}"` | `"count: ${x + 1}"` |

The transpiler SHOULD prefer string interpolation over concatenation in all cases.

## 2.3 Control flow

### If / else

Direct 1:1 mapping.

#### C# input
```csharp
if (count > 0) {
    DoSomething();
} else if (count == 0) {
    DoNothing();
} else {
    HandleNegative();
}
```

#### Beskid output
```beskid
if count > 0 {
    DoSomething();
} else if count == 0 {
    DoNothing();
} else {
    HandleNegative();
}
```

**Rule:** C# parentheses around the condition are stripped.

### Ternary operator

| C# | Beskid |
|---|---|
| `x > 0 ? "pos" : "neg"` | `if x > 0 { "pos" } else { "neg" }` or inline match |

Since Beskid does not have a ternary operator, the transpiler emits an `if/else` block or a `match` expression depending on context.

### While

Direct 1:1.

```csharp
while (running) { Step(); }
```
```beskid
while running { Step(); }
```

### For loops

#### Classic `for`
```csharp
for (int i = 0; i < 10; i++) {
    Process(i);
}
```
```beskid
for i in range(0, 10) {
    Process(i);
}
```

**Rules:**
- Standard incrementing `for (int i = start; i < end; i++)` maps to `for i in range(start, end)`.
- Non-standard loop shapes (decrementing, step > 1, complex conditions) are lowered to `while` loops.

#### `foreach`
```csharp
foreach (var item in items) {
    Process(item);
}
```
```beskid
for item in items {
    Process(item);
}
```

**Note:** Requires `items` to satisfy an iterable contract in Beskid. The transpiler inserts `.Iterate()` if needed.

### Do-while

Beskid has no `do-while`. Transpile to `while` with a flag or loop-and-break pattern:

```csharp
do { Step(); } while (condition);
```
```beskid
while true {
    Step();
    if !condition { break; }
}
```

### Switch / match

#### Switch statement (no return value)
```csharp
switch (shape) {
    case "circle":
        DrawCircle();
        break;
    case "rect":
        DrawRect();
        break;
    default:
        DrawUnknown();
        break;
}
```
```beskid
match shape {
    "circle" => { DrawCircle(); },
    "rect" => { DrawRect(); },
    _ => { DrawUnknown(); },
}
```

#### Switch expression (C# 8+)
```csharp
var desc = shape switch {
    "circle" => "round",
    "rect" => "boxy",
    _ => "unknown",
};
```
```beskid
let desc = match shape {
    "circle" => "round",
    "rect" => "boxy",
    _ => "unknown",
};
```

#### Pattern matching in switch
```csharp
string Describe(object obj) => obj switch {
    int i when i > 0 => "positive",
    int i => "non-positive",
    string s => s,
    _ => "other",
};
```

This requires the C# code to operate on typed enums or union types after transpilation. If the input uses `object`-based pattern matching, emit an error referencing §05.

For enum-based patterns:
```csharp
double Area(Shape s) => s switch {
    Circle c => Math.PI * c.Radius * c.Radius,
    Rect r => r.Width * r.Height,
    _ => 0,
};
```
```beskid
f64 Area(s: Shape) {
    return match s {
        Shape::Circle(radius) => 3.14159265358979 * radius * radius,
        Shape::Rect(width, height) => width * height,
        _ => 0.0,
    };
}
```

### Break / Continue / Return

Direct 1:1 mapping. No semantic differences.

## 2.4 Functions and methods

### Static methods

```csharp
public static int Add(int a, int b) {
    return a + b;
}
```
```beskid
pub i32 Add(a: i32, b: i32) {
    return a + b;
}
```

**Rules:**
- Parameter syntax inverts: C# `int a` → Beskid `a: i32`.
- `static` keyword is dropped (Beskid functions are free functions by default).
- Return type moves to the left of the function name.

### Instance methods

```csharp
public class Counter {
    private int _count;
    public int Increment() {
        _count += 1;
        return _count;
    }
}
```
```beskid
type Counter {
    i32 _count,
}

impl Counter {
    pub i32 Increment() {
        this._count = this._count + 1;
        return this._count;
    }
}
```

**Rules:**
- Instance methods use an implicit `this` receiver inside `impl T` blocks.
- Mutation is expressed through assignment to `this` fields.
- Receiver reference modifiers are not part of v0.1 method syntax.
- The transpiler still performs receiver-mutation analysis for optimization and diagnostics.

### Expression-bodied members

```csharp
public int Double(int x) => x * 2;
```
```beskid
pub i32 Double(x: i32) {
    return x * 2;
}
```

Expression bodies are expanded to block bodies with an explicit `return`.

### Optional / default parameters

```csharp
public void Log(string msg, int level = 0) { ... }
```

Beskid has no default parameters in v0.1. The transpiler emits overloads:

```beskid
pub unit Log(msg: string, level: i32) { ... }

pub unit Log(msg: string) {
    return Log(msg, 0);
}
```

### `params` (variadic)

Unsupported in v0.1. Emit error.

### `ref` / `out` parameters

```csharp
public bool TryParse(string s, out int result) { ... }
```
```beskid
pub bool TryParse(s: string, out result: i32) { ... }
```

Direct mapping — Beskid supports `ref` and `out` natively.

## 2.5 Lambda expressions

### Simple lambdas

```csharp
Func<int, bool> isEven = x => x % 2 == 0;
```
```beskid
let isEven = (x: i32) => x % 2 == 0;
```

### Block lambdas

```csharp
Func<int, int> factorial = x => {
    if (x <= 1) return 1;
    return x * factorial(x - 1);
};
```
```beskid
let factorial = (x: i32) => {
    if x <= 1 { return 1; }
    return x * factorial(x - 1);
};
```

### Lambda type inference

When the C# lambda's parameter types are inferred from context (e.g., LINQ), the transpiler resolves types from the semantic model and emits explicit types in Beskid.

## 2.6 String interpolation

```csharp
var msg = $"Hello, {name}! You are {age} years old.";
```
```beskid
let msg = "Hello, ${name}! You are ${age} years old.";
```

**Rules:**
- `{expr}` → `${expr}`
- Verbatim interpolated strings (`$@"..."`) strip the verbatim prefix and normalize escapes.
- Format specifiers (`{value:F2}`) are unsupported in v0.1; emit error.

## 2.7 Object creation

### Constructor calls

```csharp
var user = new User("Ada", 37);
```

Transpiled based on constructor analysis. If the constructor is a simple field initializer:

```beskid
let user = User { Name: "Ada", Age: 37 };
```

If the constructor contains logic, it maps to a factory function (see §03).

### Object initializer syntax

```csharp
var user = new User { Name = "Ada", Age = 37 };
```
```beskid
let user = User { Name: "Ada", Age: 37 };
```

Direct mapping.

### Collection initializer

```csharp
var list = new List<int> { 1, 2, 3 };
```
```beskid
let list = [1, 2, 3];
```

## 2.8 Property access

C# properties are transpiled to direct field access (for auto-properties) or explicit getter/setter methods (for computed properties). See §03 for details.

### Auto-property
```csharp
public string Name { get; set; }
```
→ Beskid field: `pub string Name`

### Computed property
```csharp
public int FullName => $"{First} {Last}";
```
→ Beskid method:
```beskid
pub string FullName() {
    return "${this.First} ${this.Last}";
}
```

## 2.9 Exception handling → Result

See §05 for full exception translation strategy. Summary:

| C# | Beskid |
|---|---|
| `throw new Exception("msg")` | `return Result::Error("msg")` |
| `try { ... } catch { ... }` | `match` on `Result` return values |
| `try { ... } finally { ... }` | Explicit cleanup at all exit points |

The transpiler rewrites throwing methods to return `Result<T, string>` and propagation uses `?`.

## 2.10 `using` statements (IDisposable)

```csharp
using (var file = File.Open("path")) {
    file.Read();
}
```

Transpiled to explicit scope with cleanup:

```beskid
let file = File.Open("path");
file.Read();
file.Dispose();
```

The transpiler inserts `Dispose()` calls at scope exit. If the type does not implement a `Disposable` contract, the `using` is simply stripped.

## 2.11 `async` / `await`

Unsupported in v0.1. Emit error with message: "async/await requires a Beskid async runtime. Convert to synchronous code or use callbacks."

## 2.12 LINQ

LINQ method syntax maps to Beskid iterator pipelines:

```csharp
var names = users
    .Where(u => u.IsActive)
    .Select(u => u.Name)
    .ToList();
```
```beskid
let names = users
    .Iterate()
    .Where(u => u.IsActive)
    .Select(u => u.Name)
    .ToList();
```

LINQ query syntax (`from x in ... select ...`) is desugared to method syntax before transpilation.

| C# LINQ | Beskid |
|---|---|
| `.Where(predicate)` | `.Where(predicate)` |
| `.Select(selector)` | `.Select(selector)` |
| `.ToList()` | `.ToList()` |
| `.First()` | Emit helper or match-based extraction |
| `.Any(predicate)` | `.Where(predicate)` + length check |
| `.Count()` | `.ToList().Len()` |
| `.OrderBy(...)` | Unsupported in v0.1 |
| `.GroupBy(...)` | Unsupported in v0.1 |
