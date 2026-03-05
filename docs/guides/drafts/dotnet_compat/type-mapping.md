# Type Mapping

## 1.1 Primitive types

| C# type | Beskid type | Notes |
|---|---|---|
| `bool` | `bool` | Direct 1:1 |
| `byte` | `u8` | Direct 1:1 |
| `sbyte` | — | Unsupported in v0.1; emit error |
| `short` | — | Unsupported in v0.1; emit error |
| `ushort` | — | Unsupported in v0.1; emit error |
| `int` | `i32` | Direct 1:1 |
| `uint` | — | Unsupported in v0.1; emit error with cast suggestion |
| `long` | `i64` | Direct 1:1 |
| `ulong` | — | Unsupported in v0.1; emit error |
| `float` | — | Unsupported in v0.1 (Beskid has `f64` only) |
| `double` | `f64` | Direct 1:1 |
| `decimal` | — | Unsupported; no Beskid equivalent |
| `char` | `char` | Both represent a Unicode scalar value |
| `string` | `string` | C# UTF-16 → Beskid UTF-8. Content-preserving |
| `void` | `unit` | Return type mapping |
| `object` | — | See §03 class flattening |

### Integer widening

When C# code uses `short`, `ushort`, or `sbyte` in arithmetic, the transpiler MAY widen to `i32` if the value range is safe. This is an optional relaxation, not a default.

## 1.2 Struct types (C# `struct`)

C# value types map directly to Beskid `type` declarations. Fields are emitted in declaration order.

### C# input
```csharp
public struct Vector2 {
    public float X;
    public float Y;
}
```

### Beskid output
```beskid
pub type Vector2 {
    f64 X,
    f64 Y,
}
```

**Rules:**
- `float` fields are widened to `f64` (Beskid has no `f32`). A transpiler warning is emitted.
- `readonly struct` maps to a Beskid `type` with all immutable bindings (default behavior).
- `ref struct` is unsupported in v0.1 (stack-only lifetime semantics have no Beskid equivalent yet).

## 1.3 Class types (C# `class`)

All C# classes are flattened to Beskid `type` declarations. See §03 for the full flattening strategy.

### C# input
```csharp
public class User {
    public string Name;
    public int Age;
}
```

### Beskid output
```beskid
pub type User {
    string Name,
    i32 Age,
}
```

**Rules:**
- Reference semantics are preserved by the Beskid compiler's allocation strategy (heap + GC).
- Access modifiers map: `public` → `pub`, everything else → private (default).
- `static` fields are not supported in v0.1 (see §05).

## 1.4 Enum types

### Simple enums (integer-backed)

C# integer enums have no direct Beskid equivalent. They are transpiled to a set of constant bindings or an algebraic enum with unit variants.

#### C# input
```csharp
public enum Color {
    Red,
    Green,
    Blue
}
```

#### Beskid output (algebraic enum)
```beskid
pub enum Color {
    Red,
    Green,
    Blue,
}
```

Integer values from the C# enum are discarded. If the C# code relies on integer casting (`(int)Color.Red`), the transpiler emits an error referencing §05.

### Enums with explicit values

```csharp
public enum HttpStatus {
    Ok = 200,
    NotFound = 404,
}
```

Transpiled to a Beskid enum with a companion `ToI32()` method:

```beskid
pub enum HttpStatus {
    Ok,
    NotFound,
}

impl HttpStatus {
    pub i32 ToI32() {
        return match this {
            HttpStatus::Ok => 200,
            HttpStatus::NotFound => 404,
        };
    }
}
```

### Flag enums (`[Flags]`)

Unsupported in v0.1. Emit error with suggestion to use a Beskid bitfield pattern.

## 1.5 Nullable types

C# nullable value types (`int?`, `bool?`) map to `Option<T>`:

| C# | Beskid |
|---|---|
| `int?` | `Option<i32>` |
| `bool?` | `Option<bool>` |
| `string?` (nullable ref) | `Option<string>` |

### Null checks

| C# | Beskid |
|---|---|
| `x == null` | `match x { Option::None => true, _ => false }` |
| `x != null` | `match x { Option::Some(_) => true, _ => false }` |
| `x ?? defaultVal` | `match x { Option::Some(v) => v, Option::None => defaultVal }` |
| `x?.Method()` | `match x { Option::Some(v) => Option::Some(v.Method()), Option::None => Option::None }` |

The transpiler SHOULD emit helper functions for common null-coalescing patterns to reduce verbosity in generated code.

## 1.6 Generic types

C# generics map to Beskid generics. Beskid uses monomorphization.

### C# input
```csharp
public struct Pair<T> {
    public T First;
    public T Second;
}
```

### Beskid output
```beskid
pub type Pair<T> {
    T First,
    T Second,
}
```

### Generic constraints

| C# constraint | Beskid mapping |
|---|---|
| `where T : IComparable` | `where T : Comparable` (contract) |
| `where T : class` | Dropped (no class/struct distinction) |
| `where T : struct` | Dropped |
| `where T : new()` | Unsupported in v0.1 |
| `where T : SomeBase` | See §03 class flattening |

## 1.7 Array types

| C# | Beskid |
|---|---|
| `int[]` | `i32[]` |
| `string[]` | `string[]` |
| `T[]` | `T[]` |
| `int[,]` (multidimensional) | Unsupported in v0.1 |
| `int[][]` (jagged) | `i32[][]` |

### Collection types

| C# | Beskid |
|---|---|
| `List<T>` | `T[]` (transpile usage sites; see §04) |
| `Dictionary<K, V>` | Beskid `Map<K, V>` when available; error in v0.1 |
| `HashSet<T>` | Beskid `Set<T>` when available; error in v0.1 |

## 1.8 Tuple types

| C# | Beskid |
|---|---|
| `(int, string)` | Anonymous `type` with fields `Item1`, `Item2` |
| `(int X, string Y)` | Anonymous `type` with fields `X`, `Y` |

### C# input
```csharp
public (string Name, int Age) GetUser() {
    return ("Ada", 37);
}
```

### Beskid output
```beskid
type __Tuple_String_I32 {
    string Name,
    i32 Age,
}

pub __Tuple_String_I32 GetUser() {
    return __Tuple_String_I32 { Name: "Ada", Age: 37 };
}
```

Tuple types are deduplicated: structurally identical tuples share the same generated `type`.

## 1.9 Function types (delegates)

| C# | Beskid |
|---|---|
| `Func<int, bool>` | `(i32) -> bool` |
| `Func<int, string, bool>` | `(i32, string) -> bool` |
| `Action` | `() -> unit` |
| `Action<int>` | `(i32) -> unit` |
| `Predicate<T>` | `(T) -> bool` |
| Custom `delegate` | Named `type` alias for the corresponding function type |

### C# input
```csharp
public delegate bool Validator(string input);
```

### Beskid output
```beskid
type Validator = (string) -> bool;
```

## 1.10 Type aliases

C# `using` aliases:

```csharp
using UserId = int;
```

Beskid has no type alias syntax in v0.1. The transpiler inlines the underlying type at all usage sites.
