# BCL Facade

This document specifies how .NET Base Class Library (BCL) types and methods are mapped to Beskid standard library equivalents.

## 4.1 Facade approach

The transpiler ships with a **built-in BCL facade map** — a hardcoded table mapping fully qualified `System.*` types and methods to their Beskid `Std.*` equivalents. No external .NET assemblies or runtimes are needed. The facade map is the single source of truth for BCL translation.

For types not covered by the built-in map, the transpiler emits a clear error with the fully qualified name and a suggestion to provide a manual Beskid implementation.

## 4.2 Core type facades

### System.Console

| C# | Beskid |
|---|---|
| `Console.WriteLine(s)` | `Std.IO.Println(s)` |
| `Console.Write(s)` | `Std.IO.Print(s)` |
| `Console.ReadLine()` | `Std.IO.ReadLine()` (when available) |

### System.String

| C# | Beskid |
|---|---|
| `s.Length` | `Std.String.Len(s)` |
| `s.ToUpper()` | `Std.String.ToUpper(s)` |
| `s.ToLower()` | `Std.String.ToLower(s)` |
| `s.Trim()` | `Std.String.Trim(s)` |
| `s.Contains(sub)` | `Std.String.Contains(s, sub)` |
| `s.StartsWith(prefix)` | `Std.String.StartsWith(s, prefix)` |
| `s.EndsWith(suffix)` | `Std.String.EndsWith(s, suffix)` |
| `s.Substring(start, len)` | `Std.String.Substring(s, start, len)` |
| `s.Split(delim)` | `Std.String.Split(s, delim)` |
| `s.Replace(old, new)` | `Std.String.Replace(s, old, new)` |
| `string.IsNullOrEmpty(s)` | `Std.String.IsEmpty(s)` |
| `string.Join(sep, items)` | `Std.String.Join(sep, items)` |
| `s + t` (concatenation) | `"${s}${t}"` |

**Note:** C# strings are UTF-16; Beskid strings are UTF-8. The transpiler does not insert conversion code — the Beskid runtime handles the encoding natively. String content is preserved as-is.

### System.Math

| C# | Beskid |
|---|---|
| `Math.Abs(x)` | `Std.Math.Abs(x)` |
| `Math.Max(a, b)` | `Std.Math.Max(a, b)` |
| `Math.Min(a, b)` | `Std.Math.Min(a, b)` |
| `Math.Sqrt(x)` | `Std.Math.Sqrt(x)` |
| `Math.Floor(x)` | `Std.Math.Floor(x)` |
| `Math.Ceiling(x)` | `Std.Math.Ceil(x)` |
| `Math.Round(x)` | `Std.Math.Round(x)` |
| `Math.PI` | `Std.Math.Pi` |
| `Math.Pow(x, y)` | `Std.Math.Pow(x, y)` |
| `Math.Clamp(v, min, max)` | `Std.Math.Clamp(v, min, max)` |

### System.Convert / parsing

| C# | Beskid |
|---|---|
| `int.Parse(s)` | `Int.Parse(s)` (returns `Result<i32, string>`) |
| `int.TryParse(s, out v)` | `match Int.Parse(s) { ... }` |
| `Convert.ToInt32(x)` | Cast or `Int.Parse` depending on source type |
| `.ToString()` | `.ToString()` method on Beskid types |

### System.Array / System.Collections.Generic

| C# | Beskid |
|---|---|
| `new int[10]` | Array initialization (when Beskid supports sized arrays) |
| `arr.Length` | `arr.Len()` |
| `arr[i]` | `arr[i]` |
| `List<T>` | `T[]` (dynamic arrays backed by Beskid runtime) |
| `list.Add(x)` | Array append (when available) |
| `list.Count` | `arr.Len()` |
| `list[i]` | `arr[i]` |
| `list.Contains(x)` | Linear search or stdlib method |
| `Dictionary<K,V>` | `Map<K, V>` (when available in stdlib) |
| `HashSet<T>` | `Set<T>` (when available in stdlib) |

### System.IO

| C# | Beskid |
|---|---|
| `File.ReadAllText(path)` | `Std.FS.ReadAllText(path)` |
| `File.WriteAllText(path, text)` | `Std.FS.WriteAllText(path, text)` |
| `File.Exists(path)` | `Std.FS.Exists(path)` |
| `Path.Combine(a, b)` | `Std.Path.Combine(a, b)` |
| `Path.GetFileName(p)` | `Std.Path.FileName(p)` |
| `Path.GetExtension(p)` | `Std.Path.Extension(p)` |

## 4.3 Facade availability tiers

Not all BCL facades will be available from day one. The transpiler uses a tiered availability model:

### Tier 1 — Available at MVP
- `System.Console` (Write, WriteLine)
- `System.String` (Length, basic operations)
- `System.Math` (core numeric functions)
- Primitive type conversions (`int.Parse`, `.ToString()`)

### Tier 2 — Near-term
- `System.IO.File` (basic file operations)
- `System.IO.Path` (path manipulation)
- `System.Collections.Generic.List<T>` → `T[]`
- `System.Linq` (Where, Select, ToList)

### Tier 3 — Future
- `System.Collections.Generic.Dictionary<K,V>` → `Map<K,V>`
- `System.Collections.Generic.HashSet<T>` → `Set<T>`
- `System.Text.StringBuilder` → `Std.String.Builder`
- `System.DateTime` / `System.TimeSpan` → `Std.Time.*`
- `System.Text.Json` → `Std.Json.*`

### Unavailable (emit error)
- `System.Threading.*` — no Beskid threading model yet
- `System.Net.*` — no Beskid networking yet
- `System.Reflection.*` — no runtime reflection in Beskid
- `System.Runtime.InteropServices.*` — use Beskid's `[Extern]` instead
- `System.Diagnostics.*` — no equivalent

## 4.4 Facade resolution algorithm

When the transpiler encounters a BCL method call:

1. **Check built-in map**: Look up the fully qualified method in the hardcoded facade table.
2. **If found**: Emit the Beskid equivalent directly.
3. **If not found**: Check if the type is in a known-unsupported list → emit a targeted error.
4. **If unknown**: Emit a stub with a `// TODO: manual migration needed` comment and a compile warning.

## 4.5 Third-party NuGet packages

Third-party NuGet types are not automatically resolved. When the transpiler encounters an unknown type from a package:

1. It emits a Beskid `type` stub with fields marked `// TODO` and method bodies as `panic("not implemented: PackageName.TypeName.Method")`.
2. The developer is expected to provide Beskid-native implementations for the methods they actually use.

This produces a **compilable but incomplete** output that clearly identifies what needs manual porting.

## 4.6 Extension methods

C# extension methods are common in BCL usage (e.g., LINQ). The transpiler handles them as follows:

1. **Known extensions** (LINQ, string helpers) are mapped via the facade table.
2. **User-defined extensions** are transpiled to free functions in the module where they were defined:

```csharp
public static class StringExtensions {
    public static bool IsNumeric(this string s) {
        return int.TryParse(s, out _);
    }
}

// Usage:
var ok = "123".IsNumeric();
```

```beskid
// StringExtensions.bd
pub bool IsNumeric(s: string) {
    return match Int.Parse(s) {
        Result::Ok(_) => true,
        Result::Error(_) => false,
    };
}

// Usage site:
let ok = StringExtensions.IsNumeric("123");
```

Call sites are rewritten from method syntax to function call syntax. If the extension method's type satisfies a Beskid contract, the transpiler MAY emit it as an `impl` method instead.

## 4.7 Events

C# events map to Beskid's native `event` system:

```csharp
public class Button {
    public event EventHandler<string> OnClick;

    public void Click() {
        OnClick?.Invoke(this, "clicked");
    }
}
```

```beskid
pub type Button {
    pub event[4] OnClick: (string) -> unit,
}

impl Button {
    pub unit Click() {
        this.OnClick("clicked");
    }
}
```

**Rules:**
- `EventHandler<T>` and custom delegate event types are mapped to Beskid function type signatures.
- The `sender` parameter (common C# pattern) is dropped unless the transpiled code actually uses it.
- Default inline capacity is `event[4]`. The developer can adjust post-transpilation.
- `?.Invoke(...)` null-conditional invocation is handled by Beskid's event system natively (no-op if no subscribers).

## 4.8 Attributes

C# attributes that have Beskid equivalents are preserved:

| C# | Beskid |
|---|---|
| Custom `[MyAttribute]` | `[MyAttribute]` (if a Beskid generator exists) |
| `[Obsolete]` | Dropped (emit warning comment) |
| `[Serializable]` | `[Serializable]` (if Beskid generator exists) |
| `[Flags]` | Unsupported — emit error |
| `[DllImport]` | `[Extern(Abi: "C")]` |

Unknown attributes are stripped with a `// stripped: [AttrName]` comment.
