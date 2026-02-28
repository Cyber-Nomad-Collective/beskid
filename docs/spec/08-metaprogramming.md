# 08. Metaprogramming

## Goals
- Provide ergonomic compile-time code generation without the complexity of Rust's procedural macros or Zig's `comptime`.
- Adopt an **Incremental Source Generator (ISG)** architecture to ensure IDE performance and fast compilation.
- Utilize a strictly typed, **Declarative Object Initializer** approach to build ASTs, rather than raw strings or imperative builder APIs.
- Utilize **Implicit Quotation** to make generating logical code blocks seamless.
- Keep diagnostics precise (errors point to macro use sites).

## The Metaprogramming Model

Beskid does not use custom `generator` or `macro` syntax blocks. Instead, metaprogramming is handled entirely through standard language features: **Contracts**, **Types**, and **Attributes**.

Generators are standard types that implement compiler-provided contracts. They observe attributed AST nodes and emit new AST nodes declaratively.

### 1. Attributes
Attributes are C#-style tags attached to declarations. They are used primarily as markers for generators to target, and their arguments map directly to fields on the generator type.

```beskid
[Builder(Suffix: "Factory")]
[Serializable(Format: "json")]
type User {
    string Name,
    i32 Age,
}
```

### 2. Generators (Contracts)
To create a generator, you define a standard `type` representing the attribute, and implement the `Std.Meta.TypeGenerator` contract.

```beskid
use Std.Meta.{MetaContext, TypeGenerator, Ast};

type Builder {
    // Maps to [Builder(Suffix: "...")]
    string Suffix,
}

impl Builder {
    // Implementing this contract tells the compiler this type acts as a generator
    unit Generate(self: Builder, ctx: MetaContext, decl: Ast.TypeDeclaration) {
        let builderName = "${decl.Name}${self.Suffix}";

        // 3. Declarative AST Construction
        // We construct the new code by declaratively initializing AST nodes.
        let newType = Ast.TypeDeclaration {
            Name: builderName,
            Modifiers: [Ast.Modifier.Pub],
            
            // Declarative list generation using iterators
            Fields: decl.Fields.Iterate().Select(f => Ast.FieldDeclaration {
                Name: f.Name,
                Type: Ast.TypePath { Name: "Option", GenericArgs: [f.Type] }
            }).ToList(),

            ImplBlock: Ast.ImplBlock {
                TargetType: builderName,
                Methods: [
                    Ast.MethodDeclaration {
                        Name: "Build",
                        ReturnType: decl.Name,
                        Modifiers: [Ast.Modifier.Pub],
                        // 4. Implicit Quotation
                        // The Body field expects an Ast.Block. The compiler automatically 
                        // parses this standard code block into an Ast.Block at compile time.
                        Body: {
                            // Standard Beskid logic goes here.
                            return null;
                        }
                    }
                ]
            }
        };

        // Inject the generated AST into the compilation
        ctx.AddSource("${builderName}.g.bd", newType);
    }
}
```

## Core Innovations

### Declarative AST Construction
Instead of imperative builder patterns (`target.AddField(...)`), Beskid uses declarative object initializers. The structure of the generation code visually maps 1:1 with the output structure.

### Implicit Quotation for Logic
Constructing AST trees for logic (if statements, math, assignments) is notoriously difficult. Beskid solves this through Implicit Quotation. 

If a struct field or function parameter is statically typed as `Ast.Block` or `Ast.Expression`, the compiler *does not evaluate* the provided code. Instead, it parses the standard Beskid code into an AST node and assigns it. This provides full IDE syntax highlighting and linting while writing generator logic.

### Dynamic AST Splicing
You can splice dynamically generated AST nodes into implicitly quoted blocks by simply referencing the AST variables:

```beskid
let defaultVal: Ast.Expression = Ast.LiteralInt(0);

let method = Ast.MethodDeclaration {
    Name: "Reset",
    ReturnType: "unit",
    Body: {
        // The compiler splices the `defaultVal` AST node here
        self.Count = defaultVal; 
    }
};
```

## Generator Context API (`MetaContext`)
The context allows generators to interact with the compiler during the `Generate` phase:
- `ctx.AddSource(filename: string, node: Ast.Node)`: Appends a generated AST to the compilation.
- `ctx.ReportError(span: Span, message: string)`: Reports a compile-time error at a specific location.
- `ctx.ReportWarning(span: Span, message: string)`: Reports a compile-time warning.

## Restrictions (v0.1)
- **No reflection in runtime code:** Metaprogramming is strictly isolated to compile-time contract execution.
- **Append-only:** Generators can only *add* new code. They cannot modify or delete the existing code they are observing (this preserves standard language semantics and avoids confusing mutations).
- **No I/O:** No reading files or network calls during expansion to ensure deterministic, fast, and cacheable builds.

## Expansion Phase
1. Parse source into AST.
2. Identify nodes tagged with attributes.
3. If an attribute's type implements a Meta contract (like `TypeGenerator`), instantiate the type and execute its `Generate` method.
4. Integrate the newly emitted AST nodes.
5. Proceed to Name Resolution and Type Checking for the combined source.
