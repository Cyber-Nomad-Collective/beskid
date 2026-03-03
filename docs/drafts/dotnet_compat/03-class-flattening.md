# 03. Class Flattening

Beskid has no class hierarchy. All C# classes are flattened to Beskid `type` (struct) declarations. This document specifies how inheritance, polymorphism, and constructors are eliminated.

## 3.1 Core rule

> Every C# `class` becomes a Beskid `type`. There are no exceptions.

## 3.2 Simple classes (no inheritance)

Direct mapping — fields become `type` fields, methods move to an `impl` block.

### C# input
```csharp
public class Point {
    public int X;
    public int Y;

    public int Manhattan() => Math.Abs(X) + Math.Abs(Y);
}
```

### Beskid output
```beskid
pub type Point {
    i32 X,
    i32 Y,
}

impl Point {
    pub i32 Manhattan() {
        return Std.Math.Abs(this.X) + Std.Math.Abs(this.Y);
    }
}
```

## 3.3 Inheritance → Composition

C# single inheritance is translated to **field embedding** (composition). The base class becomes a field in the derived type.

### C# input
```csharp
public class Animal {
    public string Name;
    public void Speak() => Console.WriteLine($"{Name} speaks");
}

public class Dog : Animal {
    public string Breed;
    public void Fetch() => Console.WriteLine($"{Name} fetches");
}
```

### Beskid output
```beskid
pub type Animal {
    string Name,
}

impl Animal {
    pub unit Speak() {
        Std.IO.Println("${this.Name} speaks");
    }
}

pub type Dog {
    Animal Base,
    string Breed,
}

impl Dog {
    pub unit Fetch() {
        Std.IO.Println("${this.Base.Name} fetches");
    }

    // Forwarding method for inherited behavior
    pub unit Speak() {
        this.Base.Speak();
    }
}
```

### Flattening rules

1. The base class is embedded as a field named `Base`. For deep hierarchies: `Base` contains its own `Base`, forming a chain.
2. **Method forwarding**: For every public method on the base class, the transpiler generates a forwarding method on the derived type that delegates to `this.Base.Method(...)`.
3. **Field access forwarding**: C# code that accesses inherited fields (e.g., `Name` on `Dog`) is rewritten to access through the base chain (e.g., `this.Base.Name`).

### Deep hierarchies

```csharp
class A { public int X; }
class B : A { public int Y; }
class C : B { public int Z; }
```

```beskid
type A { i32 X }
type B { A Base, i32 Y }
type C { B Base, i32 Z }
```

Access to `C.X` becomes `this.Base.Base.X`. The transpiler resolves the chain statically.

## 3.4 Field inlining (optional optimization)

For sealed classes or classes with no virtual methods, the transpiler MAY choose to **inline** base fields directly into the derived type instead of embedding:

```beskid
// Inlined alternative (when safe)
pub type Dog {
    string Name,   // from Animal
    string Breed,  // own field
}
```

This is an optimization the transpiler applies when:
- The base class is not used polymorphically anywhere in the transpiled codebase
- No code casts between base and derived types
- The base class has no virtual methods

A `// inlined from: ClassName` comment is emitted for traceability.

## 3.5 Constructors → Factory functions

C# constructors become either struct literal construction or named factory functions.

### Trivial constructor (field assignment only)

```csharp
public class User {
    public string Name;
    public int Age;
    public User(string name, int age) {
        Name = name;
        Age = age;
    }
}
```

The transpiler detects that the constructor is a simple field initializer and emits direct construction:

```beskid
pub type User {
    string Name,
    i32 Age,
}

// Call sites: new User("Ada", 37) → User { Name: "Ada", Age: 37 }
```

### Complex constructor (contains logic)

```csharp
public class Connection {
    public string Host;
    public int Port;
    public bool IsSecure;

    public Connection(string url) {
        var parts = url.Split(':');
        Host = parts[0];
        Port = int.Parse(parts[1]);
        IsSecure = Port == 443;
    }
}
```

```beskid
pub type Connection {
    string Host,
    i32 Port,
    bool IsSecure,
}

pub Connection New(url: string) {
    let parts = url.Split(":");
    let host = parts[0];
    let port = Int.Parse(parts[1]);
    let isSecure = port == 443;
    return Connection { Host: host, Port: port, IsSecure: isSecure };
}
```

**Rules:**
- Complex constructors become `New(...)` factory functions.
- If multiple constructors exist, they become `New(...)`, `NewFrom(...)`, etc. — or overloaded `New` functions if Beskid's overload resolution supports it.
- Constructor chaining (`this(...)`) is inlined.

### Base constructor calls

```csharp
public class Dog : Animal {
    public string Breed;
    public Dog(string name, string breed) : base(name) {
        Breed = breed;
    }
}
```

```beskid
pub Dog New(name: string, breed: string) {
    return Dog {
        Base: Animal { Name: name },
        Breed: breed,
    };
}
```

## 3.6 Virtual methods → Contract dispatch

C# virtual/override methods are translated to Beskid contracts.

### C# input
```csharp
public abstract class Shape {
    public abstract double Area();
}

public class Circle : Shape {
    public double Radius;
    public override double Area() => Math.PI * Radius * Radius;
}

public class Rect : Shape {
    public double Width;
    public double Height;
    public override double Area() => Width * Height;
}
```

### Beskid output

The abstract class becomes a **contract**. Each concrete subclass becomes a `type` that explicitly declares conformance via `type Type : Contract { ... }`, with methods provided in `impl Type { ... }`.

```beskid
contract Shape {
    f64 Area();
}

pub type Circle : Shape {
    f64 Radius,
}

impl Circle {
    pub f64 Area() {
        return 3.14159265358979 * this.Radius * this.Radius;
    }
}

pub type Rect : Shape {
    f64 Width,
    f64 Height,
}

impl Rect {
    pub f64 Area() {
        return this.Width * this.Height;
    }
}
```

### Detection rules

The transpiler identifies the abstract/virtual pattern and applies this translation when:
1. A class has `abstract` methods → becomes a `contract`
2. A class has `virtual` methods with a body → becomes a `contract` + default impl
3. Subclasses with `override` → `type Type : Contract { ... }` plus `impl Type { ... }` methods

### Virtual methods with default implementation

```csharp
public class Base {
    public virtual string Describe() => "base";
}
public class Derived : Base {
    public override string Describe() => "derived";
}
```

```beskid
contract Describable {
    string Describe();
}

type Base : Describable {}

impl Base {
    pub string Describe() {
        return "base";
    }
}

type Derived : Describable {
    Base Base,
}

impl Derived {
    pub string Describe() {
        return "derived";
    }
}
```

Both `Base` and `Derived` satisfy `Describable` through explicit declarations.

## 3.7 Interfaces → Contracts

C# interfaces map directly to Beskid contracts.

### C# input
```csharp
public interface IReader {
    int Read(byte[] buffer);
}

public interface IWriter {
    int Write(byte[] buffer);
}

public interface IReadWriter : IReader, IWriter { }
```

### Beskid output
```beskid
contract Reader {
    i32 Read(buffer: u8[]);
}

contract Writer {
    i32 Write(buffer: u8[]);
}

contract ReadWriter {
    Reader
    Writer
}
```

**Rules:**
- `I` prefix is stripped (C# convention `IReader` → Beskid `Reader`).
- Interface composition maps to Beskid contract composition.
- Implementing types must use explicit declarations: `type Type : Contract { ... }` and method bodies in `impl Type { ... }`.
- Default interface methods (C# 8+) are emitted as standalone helper functions.

## 3.8 `sealed` classes

Sealed classes are an optimization hint. Since Beskid has no inheritance, all types are effectively sealed. The `sealed` keyword is simply dropped.

## 3.9 `static` classes → Modules

```csharp
public static class MathHelper {
    public static int Clamp(int value, int min, int max) {
        return Math.Max(min, Math.Min(max, value));
    }
}
```

```beskid
// File: MathHelper.bd
pub i32 Clamp(value: i32, min: i32, max: i32) {
    return Std.Math.Max(min, Std.Math.Min(max, value));
}
```

Static classes become Beskid modules (one file = one module). All static methods become free functions.

## 3.10 `partial` classes

Partial class declarations are merged into a single `type` before transpilation. This is a pre-processing step — the transpiler concatenates all `partial class X` declarations, deduplicates fields, and merges method lists.

## 3.11 Casts and type checks

| C# | Beskid |
|---|---|
| `(Circle)shape` | Only valid if `shape` is statically `Circle` |
| `shape is Circle c` | Match arm: `Shape::Circle(c) =>` (if using enum encoding) |
| `shape as Circle` | `Option`-returning match |

If the transpiled code uses contract-typed values, downcasting is not possible. The transpiler emits an error if it detects downcast patterns that cannot be expressed in Beskid's type system.

## 3.12 Polymorphic collections

```csharp
List<Shape> shapes = new() { new Circle(5), new Rect(3, 4) };
foreach (var s in shapes) {
    Console.WriteLine(s.Area());
}
```

This requires a **sum type** (algebraic enum) rather than a contract, because the collection holds heterogeneous values:

```beskid
enum ShapeValue {
    CircleVal(Circle circle),
    RectVal(Rect rect),
}

impl ShapeValue {
    f64 Area() {
        return match this {
            ShapeValue::CircleVal(c) => c.Area(),
            ShapeValue::RectVal(r) => r.Area(),
        };
    }
}

let shapes = [
    ShapeValue::CircleVal(Circle { Radius: 5.0 }),
    ShapeValue::RectVal(Rect { Width: 3.0, Height: 4.0 }),
];

for s in shapes {
    Std.IO.Println(s.Area().ToString());
}
```

The transpiler generates a wrapper enum when it detects polymorphic collection usage. The enum variant names are derived from the concrete type names.
