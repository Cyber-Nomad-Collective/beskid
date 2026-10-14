# Beskid language rules

This sheet gives the Beskid language rules that you need for a short task. It does not describe the `beskid` commands. For the commands, use the help of the `beskid` command.

## Files and modules

- A Beskid source file has the extension `.bd`.
- A project keeps its source files in its `Src` folder. The `.bproj` file next to `Src` is the project manifest.
- Each source file is a module. The path of the file below `Src` gives the module path:
  - `Src/Shapes.bd` is the module `Shapes`.
  - `Src/Text/Format.bd` is the module `Text.Format`.
- Each segment of a module path starts with an uppercase letter.

## Names

- Names are case-sensitive.
- Functions, types and module path segments use PascalCase, for example `Area` and `Main`.
- Parameters and local values use lowerCamelCase, for example `width` and `total`.

## Types

These are the most frequent types:

| Type | Values |
|---|---|
| `i32` | 32-bit signed integers, for example `42` |
| `i64` | 64-bit signed integers |
| `bool` | `true` and `false` |
| `string` | text, for example `"hello"` |
| `unit` | no value |

## Functions

A function starts with its return type. The name, the parameters in parentheses and the body in braces follow. Each parameter has a type and a name. Each statement ends with a semicolon (`;`).

```beskid
i32 Area(i32 width, i32 height) {
    return width * height;
}
```

A function that returns no value has the return type `unit`:

```beskid
use Core.Output;

unit Greet(string name) {
    Output.WriteLine("Hello, " + name);
}
```

## Local values

- Write the type, the name and the value: `i32 limit = 10;`.
- Or write `let`, the name and the value. The compiler then finds the type: `let total = Area(2, 3);`.
- A local value is immutable. To assign a new value later, write `mut` before the type or after `let`:

```beskid
mut i32 count = 0;
count = count + 1;
let mut steps = 0;
steps = steps + 2;
```

## Visibility

- An item is private to its module by default. Other modules cannot use it.
- `pub` before an item makes the item public. Other modules can then use it. Other projects that use the library can also use it.

```beskid
pub i32 Area(i32 width, i32 height) {
    return width * height;
}
```

## Use items from other modules

- To call a public function of another module, write the full module path, a period and the function name: `Shapes.Area(2, 3)`.
- A `use` declaration gives a shorter name. `use Text.Format;` lets you write `Format.Pad(...)` in place of `Text.Format.Pad(...)`.
- `use Text.Format as Fmt;` lets you write `Fmt.Pad(...)`.
- Write `use` declarations at the start of the file.
- The Corelib is available to each application. Its module paths start with `Core`, for example `Core.Output`.

## Libraries

- A library is a project that other projects use. Its manifest declares a target of kind `Lib`.
- A project can use a library only when the manifest of the project declares the library as a dependency.
- Code uses the modules of a library with their module paths. For example, a library has the file `Src/Shapes.bd` with a `pub` function `Area`. A project that declares this library as a dependency calls `Shapes.Area(2, 3)`.
- The dependency name in the manifest is not a part of the module path.

## Entry point

- An application project starts at the top-level function `Main` in its entry file.
- `i32 Main()` returns the exit status of the program. The status `0` means success.

```beskid
i32 Main() {
    return Shapes.Area(2, 3) - 6;
}
```

## Comments

- `//` starts a comment. The comment continues to the end of the line.
