# 13. Code Style and Naming

This document defines the default naming and style rules for Pecan source code.

Primary goal: **C#-style readability** with consistent naming across language, stdlib, and tooling.

## 13.1 Naming conventions (required)

### Types and type-like symbols: `PascalCase`
Use `PascalCase` for:
- `type` names
- `enum` names
- `enum` variants
- `contract` names
- generic type parameters (single or short names like `T`, `TItem`, `TResult`)

Examples:
```pecan
pub type HttpClient {
    string BaseUrl,
}

enum Result<TValue, TError> {
    Ok(TValue value),
    Error(TError error),
}

contract Disposable {
    unit Dispose();
}
```

### Values and callable symbols
Use C# conventions:
- `PascalCase` for function and method names
- `camelCase` for parameters and local variables
- `PascalCase` for module-level public value-like constants

Examples:
```pecan
pub string FormatError(string errorCode) {
    let message = "Unexpected error";
    return message;
}

unit WriteLine(string text) {
    Std.IO.Println(text);
}
```

### Modules and namespaces: `PascalCase`
Use `PascalCase` for namespace/module path segments.

Examples:
- `Std.IO`
- `Std.Collections`
- `Std.Hashing`

Avoid mixed casing styles within a namespace chain.

## 13.2 Acronyms

Follow C#-style acronym handling:
- Two-letter acronyms are all caps in `PascalCase`: `IOStream`.
- Longer acronyms are treated as words: `HttpClient`, `JsonWriter`, `Utf8String`.

For `camelCase`, lowercase the first letter only:
- `httpClient`
- `jsonWriter`

## 13.3 File and folder naming

Use C#-style names on disk as well (no `snake_case`):
- `PascalCase` for files that define primary public symbols
- `PascalCase` for directories representing namespaces

Examples:
- `HttpClient.pn`
- `StringBuilder.pn`
- `Std/Collections/`

## 13.4 Visibility and API hygiene

- Default to private symbols.
- Mark only stable, intended API surface as `pub`.
- Keep implementation helpers private to reduce accidental coupling.

## 13.5 Standard library naming policy

- Public type names: `PascalCase`.
- Public function and method names: `PascalCase`.
- Public module segments: `PascalCase`.
- Avoid abbreviations unless standard (`utf8`, `http`, `json`).

## 13.6 Lint guidance (recommended)

Tooling should eventually provide opt-in lints:
- `non_pascal_case_type`
- `non_pascal_case_function`
- `non_camel_case_variable`
- `non_pascal_case_module`

These should start as warnings and be promotable to errors in CI.
