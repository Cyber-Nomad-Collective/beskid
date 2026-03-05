---
title: "Tooling and CLI Integration"
---


## 6.1 Crate: `beskid_dotnet`

A new workspace member crate that houses the entire C# → Beskid transpiler.

### Dependencies

| Dependency | Purpose |
|---|---|
| `tree-sitter` + `tree-sitter-c-sharp` | Parse C# source into a concrete syntax tree (CST) |
| `beskid_abi` | Shared type and symbol definitions |

### Internal modules

```
beskid_dotnet/
├── src/
│   ├── lib.rs                  // Public API
│   ├── csharp/
│   │   ├── parser.rs           // tree-sitter CST → typed C# AST
│   │   ├── ast.rs              // C# AST node definitions
│   │   ├── semantic.rs         // Type resolution, scope analysis
│   │   └── project.rs          // .csproj / solution file reader
│   ├── resolve/
│   │   ├── bcl_facade.rs       // Built-in BCL → Beskid mapping table
│   │   └── types.rs            // Resolved type representation
│   ├── transpile/
│   │   ├── emitter.rs          // C# AST → Beskid source text emission
│   │   ├── types.rs            // Type mapping rules (§01)
│   │   ├── constructs.rs       // Statement/expression mapping (§02)
│   │   ├── flattening.rs       // Class hierarchy elimination (§03)
│   │   ├── nullability.rs      // Nullable → Option rewriting
│   │   ├── exceptions.rs       // try/catch → Result rewriting
│   │   └── events.rs           // C# event → Beskid event mapping
│   ├── diagnostics.rs          // Error/warning reporting (§05 codes)
│   └── config.rs               // Transpiler configuration
└── Cargo.toml
```

## 6.2 CLI command

The transpiler is invoked via the Beskid CLI:

```
pekan dotnet <subcommand> [options]
```

### Subcommands

#### `pekan dotnet transpile`

Transpile C# source files to Beskid `.bd` files.

```
pekan dotnet transpile <input> [--output <dir>] [--project <csproj>]
```

| Flag | Description |
|---|---|
| `<input>` | Path to a `.cs` file, directory of `.cs` files, or `.csproj` |
| `--output <dir>` | Output directory for generated `.bd` files (default: `./generated/`) |
| `--project <csproj>` | C# project file for dependency and reference resolution |
| `--strict` | Treat warnings as errors |
| `--dry-run` | Print what would be generated without writing files |

**Examples:**
```bash
# Transpile a single file
pekan dotnet transpile src/Models/User.cs --output lib/

# Transpile a whole C# project
pekan dotnet transpile --project MyApp.csproj --output src/generated/

```

#### `pekan dotnet check`

Analyze C# source and report what is and isn't supported, without generating output.

```
pekan dotnet check <input> [--project <csproj>]
```

Output:
```
Checking src/Models/User.cs ...
  ✓ User class → type User { ... }
  ✓ User.GetFullName() → impl method
  ✗ CS2BD-300: try/catch in User.Parse() — use Result<T, E>
  ⚠ CS2BD-W01: float field widened to f64

Summary: 12 constructs supported, 1 error, 1 warning
```

#### `pekan dotnet init`

Initialize a Beskid project from a C# project, setting up the output structure and config file.

```
pekan dotnet init --project MyApp.csproj --output my_app/
```

This creates:
```
my_app/
├── Project.proj          // Beskid project file
├── src/
│   └── (empty, ready for transpiled output)
└── dotnet.toml           // Transpiler configuration
```

## 6.3 Configuration file: `dotnet.toml`

Per-project transpiler configuration:

```toml
[source]
# C# project or source directory
project = "../MyApp/MyApp.csproj"
# Or direct source path
# sources = ["../MyApp/src/"]

[output]
directory = "src/generated"
# Whether to overwrite existing files
overwrite = true

[mapping]
# Custom type mappings (override defaults)
[mapping.types]
"MyApp.Models.UserId" = "i64"
"MyApp.Models.Timestamp" = "i64"

# Custom BCL facade overrides
[mapping.methods]
"MyApp.Helpers.Logger.Log" = "Std.IO.Println"

[options]
# Treat warnings as errors
strict = false
# Inline base class fields instead of embedding (when safe)
inline_bases = true
# Strip I-prefix from interface names
strip_interface_prefix = true
# Default event capacity for transpiled C# events
default_event_capacity = 4
```

## 6.4 Project model integration

### Reading `.csproj` files

The transpiler reads `.csproj` XML to discover:
- Source files (`<Compile Include="...">` or implicit globbing)
- Package references (`<PackageReference Include="..." Version="...">`)
- Project references (`<ProjectReference Include="...">`)
- Target framework (`<TargetFramework>net8.0</TargetFramework>`)

This is used to:
1. Enumerate all `.cs` files to transpile
2. Identify package and project references for stub generation
3. Determine target framework for facade compatibility

### NuGet package resolution

The transpiler looks for restored packages in the standard NuGet cache:
- Linux: `~/.nuget/packages/`
- macOS: `~/.nuget/packages/`
- Windows: `%USERPROFILE%\.nuget\packages\`

For each `<PackageReference>`, the transpiler checks the built-in facade map. Unknown packages produce stubs with `// TODO` markers (see §04.5).

## 6.5 Output structure

The transpiler preserves the C# namespace structure as Beskid module paths:

### C# project layout
```
MyApp/
├── Models/
│   ├── User.cs          // namespace MyApp.Models
│   └── Order.cs         // namespace MyApp.Models
├── Services/
│   └── UserService.cs   // namespace MyApp.Services
└── Program.cs           // namespace MyApp
```

### Generated Beskid layout
```
src/generated/
├── Models/
│   ├── User.bd
│   └── Order.bd
├── Services/
│   └── UserService.bd
└── Program.bd
```

**Rules:**
- One `.cs` file → one `.bd` file.
- If a `.cs` file contains multiple types, they are either kept in one `.bd` file or split (configurable).
- `partial class` pieces are merged into a single `.bd` file.
- Namespace segments become directory names (PascalCase, matching Beskid convention).
- Generated files include a header comment: `// Generated from: Models/User.cs by pekan dotnet transpile`

## 6.6 Incremental transpilation

The transpiler supports incremental mode:
1. On first run, all `.cs` files are transpiled and a manifest (`dotnet_manifest.json`) is written.
2. On subsequent runs, only files whose content hash has changed are re-transpiled.
3. If a type's public signature changes, all files that reference it are re-transpiled.

The manifest tracks:
```json
{
  "version": 1,
  "files": {
    "Models/User.cs": {
      "hash": "sha256:abc123...",
      "output": "src/generated/Models/User.bd",
      "types_exported": ["User"],
      "types_imported": ["Order"]
    }
  }
}
```

## 6.7 Transpilation pipeline stages

The transpiler executes in well-defined stages:

1. **Discovery** — Enumerate `.cs` files from project or directory
2. **Parse** — tree-sitter-c-sharp → CST for each file
3. **AST build** — CST → typed C# AST with scope/symbol tables
4. **Resolve** — Resolve external type references via built-in BCL facade map
5. **Analyze** — Detect unsupported constructs, compute mutation analysis, identify inheritance patterns
6. **Transform** — Apply class flattening, null→Option, exception→Result rewrites
7. **Emit** — Generate Beskid source text from transformed AST
8. **Write** — Write `.bd` files to output directory
9. **Report** — Print summary of errors, warnings, and generated files

Each stage is independently testable. The pipeline can be halted after any stage for debugging (`--stage parse`, `--stage analyze`, etc.).

## 6.8 Testing strategy

### Unit tests
- **Parser tests**: C# snippets → expected AST nodes
- **Type mapping tests**: C# type → expected Beskid type string
- **Construct mapping tests**: C# statement → expected Beskid statement
- **Flattening tests**: Class hierarchies → expected composition structures
- **Facade tests**: BCL call → expected Beskid stdlib call

### Integration tests
- **End-to-end**: `.cs` file → transpile → parse as Beskid → assert valid
- **Round-trip**: Transpile → compile with Beskid → JIT execute → assert output matches C# program's expected output

### Snapshot tests
- Golden file tests: each test case is a `.cs` input and a `.bd.expected` output. The transpiler runs and diffs against the expected file.

Test location: `crates/beskid_tests/src/dotnet/`
