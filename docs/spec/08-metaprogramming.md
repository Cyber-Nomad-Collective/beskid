# 08. Metaprogramming

## Goals
- Provide ergonomic compile-time code generation without the complexity of Rust's procedural macros or Zig's `comptime`.
- Adopt an **Incremental Source Generator (ISG)** architecture (inspired by C# .NET 6/7) to ensure IDE performance and fast compilation.
- Use a simple string-emission approach rather than manually constructing AST nodes.
- Keep diagnostics precise (errors point to macro use sites).

## The Metaprogramming Model

Beskid uses declarative `generator` blocks coupled with attributes. Generators are evaluated at compile time. They observe attributed AST nodes and emit new source code strings which are then compiled alongside the rest of the project.

### 1. Attributes
Attributes are C#-style tags attached to declarations. They are used primarily as markers for generators to target.

```beskid
[Builder]
[Serializable(format: "json")]
type User {
    string name,
    i32 age,
}
```

### 2. Generators (`generator {}`)
A generator defines what it targets and how it emits new code. By using declarative targets, the compiler can heavily optimize execution, fulfilling the "incremental" part of ISG. The compiler only runs the generator when the specific target nodes are modified.

```beskid
generator BuilderGenerator {
    // 1. Declarative Target (Filter)
    // The compiler uses this to efficiently filter files without doing full
    // semantic analysis, similar to C#'s `ForAttributeWithMetadataName`.
    target: Ast.TypeDeclaration with [Builder];

    // 2. Emission logic
    emit(ctx: GeneratorContext, node: Ast.TypeDeclaration, attr: Ast.Attribute) {
        let name = node.name;
        let builder_name = name + "Builder";

        // Generate the new code as a string. 
        // This is vastly simpler than building ASTs manually.
        let mut fields_code = "";
        for f in node.fields {
            fields_code = fields_code + f"    Option<{f.type_name}> {f.name},\n";
        }

        let code = f"
            type {builder_name} {{
{fields_code}
            }}

            impl {builder_name} {{
                {builder_name} new() {{ ... }}
            }}
        ";

        // Inject the generated string into the compilation
        ctx.add_source(builder_name + ".g.bd", code);
    }
}
```

## Generator Context API (`GeneratorContext`)
The context allows generators to interact with the compiler during the `emit` phase:
- `ctx.add_source(filename: string, code: string)`: Appends a new file to the compilation.
- `ctx.report_error(span: Span, message: string)`: Reports a compile-time error at a specific location.
- `ctx.report_warning(span: Span, message: string)`: Reports a compile-time warning.

Example of diagnostics:
```beskid
emit(ctx: GeneratorContext, node: Ast.TypeDeclaration, attr: Ast.Attribute) {
    if node.fields.is_empty() {
        ctx.report_error(node.span, "Builder requires at least one field.");
        return;
    }
    // ...
}
```

## Restrictions (v0.1)
- **No reflection in runtime code:** Metaprogramming is strictly isolated to compile-time `generator` blocks.
- **Append-only:** Generators can only *add* new code. They cannot modify or delete the existing code they are observing (this preserves standard language semantics and avoids confusing mutations).
- **No I/O:** No reading files or network calls during expansion to ensure deterministic, fast, and cacheable builds.

## Expansion Phase
1. Parse source into AST.
2. Identify nodes matching `target` definitions in active generators.
3. Execute the `emit` functions for matched nodes.
4. Parse the newly emitted source code.
5. Proceed to Name Resolution and Type Checking for the combined source.
