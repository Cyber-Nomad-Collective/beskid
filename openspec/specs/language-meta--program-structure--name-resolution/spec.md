<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# Name resolution Specification

## Purpose

This specification defines scopes, imports, and shadowing. These rules tie syntax to symbols. Diagnostics for unresolved names cite these rules verbatim.
## Requirements
### Requirement: Use declaration resolution and diagnostics
`use Path;` MUST import the final segment into the current scope; `use Path as Alias;` MUST bind the resolved target to `Alias`. Unknown import paths MUST error (**E1105**); ambiguous imports MUST error (**E1104**); `use` before declaration in the same module MUST error (**E1106**) when forward reference is illegal.

#### Scenario: Unknown import path
- **GIVEN** a `use` declaration whose path does not resolve to any module or item
- **WHEN** name resolution processes imports
- **THEN** the compiler emits **E1105** and does not bind the import

### Requirement: Value and type path binding
Value paths MUST resolve to functions, locals, constants, enum constructors, and contract namespaces. Type paths MUST resolve to types, generics, and primitive names. Unresolved value names MUST error (**E1101**); unresolved type names MUST error (**E1201**); unknown module segments MUST error (**E1108**).

#### Scenario: Unresolved value name
- **GIVEN** an expression that references a value name with no binding in scope
- **WHEN** value-path resolution runs
- **THEN** the compiler emits **E1101**

### Requirement: Visibility, duplicates, and shadowing
Resolution MUST respect visibility from the importer’s module; private item access MUST error (**E1107**). Duplicate definitions in the same scope MUST error once, with **E1102**. Inner scopes MAY shadow outer locals; shadowing SHOULD warn (**W1103**). Generic parameters shadow type names in signature scope only for the declaring signature.

#### Scenario: Private item accessed across modules
- **GIVEN** a reference from module A to a non-`pub` item in module B
- **WHEN** visibility checking runs during resolution
- **THEN** the compiler emits **E1107**

### Requirement: Single resolver snapshot and stable qualified names
The package driver and typechecker MUST share one resolution snapshot per compilation. Emitted metadata MUST record stable `qualifiedName` strings for tooling across compiles. Resolution MUST NOT inject nullable or `optional` aliases as implicit imports.

#### Scenario: Shared resolution snapshot
- **GIVEN** a multi-module compilation
- **WHEN** the package driver and typechecker consult name bindings
- **THEN** both consume the same resolution snapshot and each resolved symbol has a stable `qualifiedName`

### Requirement: Inline modules are lexical scopes
An inline module `mod Name { ... }` SHALL be a lexical scope inside the scope that declares it. A name that a scope does not bind SHALL resolve in the enclosing scope, and so on up to the file scope. This SHALL apply to functions, types, enums, contracts, constants and `use` bindings. A binding of an inner scope SHALL shadow a binding of the same name of an outer scope, inside the inner scope only. A binding of an inline module SHALL NOT be visible by its bare name outside that module.

#### Scenario: File constant in an inline module
- **GIVEN** `const Limit = 7;` at file level and `mod T { test X { Assert.Equal(Limit, 7, "c"); } }`
- **WHEN** the file is checked and the test runs
- **THEN** no diagnostic is reported and the test passes

#### Scenario: Module constant shadows the file constant
- **GIVEN** `const Limit = 7;` at file level, `mod T { const Limit = 9; }`, a use of `Limit` inside `T` and a use of `Limit` in a file-level function
- **WHEN** the file is compiled
- **THEN** the use inside `T` has the value 9 and the use in the file-level function has the value 7

#### Scenario: Module constant outside its module
- **GIVEN** `mod T { const Limit = 9; }` and a file-level function that returns `Limit`
- **WHEN** the file is checked
- **THEN** the compiler SHALL report **E1101** for `Limit`

### Requirement: Use declarations in inline modules
A `use` declaration inside an inline module SHALL bind its alias and the items that it imports in that module and in the inline modules nested in it. It SHALL NOT bind them in the enclosing scope. A `pub use` inside an inline module SHALL NOT add to the public API of the source unit.

#### Scenario: Import inside a module
- **GIVEN** `mod A { use Core.Random; test X { mut Random rng = Random.New(); } }`
- **WHEN** the file is checked
- **THEN** `Random` resolves inside `A` and no diagnostic is reported

#### Scenario: Import does not reach the file scope
- **GIVEN** `mod A { use Core.Random; }` and a file-level function that calls `Random.New()`
- **WHEN** the file is checked
- **THEN** the compiler reports that `Random` is unknown at the file-level call

### Requirement: Duplicate names per scope
The compiler SHALL compare the names of functions, types, enums, contracts, module declarations, inline modules, constants and `use` aliases for duplicates in one scope only: the file scope or one inline module. The same name in two different scopes, including an inline module nested in the scope, SHALL NOT be a duplicate. Each duplicate in one scope SHALL be reported exactly once, as **E1102**, at the later declaration, and the diagnostic SHALL give the first declaration as the previous location: two functions, two types, enums or contracts (in any combination, generic or not), two `use` aliases, a `use` alias and a function, two module declarations, two constants, or two tests with the same name in one module. A duplicate SHALL NOT also be reported as **E1001**, **E1006** or **E1104**.

#### Scenario: Same function name in two scopes
- **GIVEN** a file-level function `Helper` and a function `Helper` in `mod A { }`
- **WHEN** the file is checked
- **THEN** no duplicate is reported, a call of `Helper` inside `A` names the function of `A`, and a call at file level names the file-level function

#### Scenario: Same use in two scopes
- **GIVEN** `use Core.Random;` at file level and `use Core.Random;` inside `mod A { }`
- **WHEN** the file is checked
- **THEN** no duplicate is reported

#### Scenario: Duplicate tests in one module
- **GIVEN** `mod Topic { test Same { } test Same { } }`
- **WHEN** the file is checked
- **THEN** the compiler SHALL report **E1102** once and SHALL NOT report **E1006**

#### Scenario: Duplicate function in one module
- **GIVEN** `mod Topic { i64 Twice() { return 1; } i64 Twice() { return 2; } }`
- **WHEN** the file is checked
- **THEN** the compiler SHALL report **E1102** once for `Twice` and no other duplicate code

#### Scenario: Duplicate use alias in one scope
- **GIVEN** `use Core.Random;` twice at file level, or twice inside `mod Topic { }`
- **WHEN** the file is checked
- **THEN** the compiler SHALL report **E1102** once for `Random` and SHALL NOT report **E1006** or **E1104**

#### Scenario: Duplicate type, enum or contract in one scope
- **GIVEN** `type Point { i64 x; } type Point { i64 y; }` at file level, `mod Shapes { mod Inner { enum Kind { Dot } enum Kind { Line } } }`, or `mod Boxes { type Box<T> { T value; } type Box<U> { U value; } }`
- **WHEN** the file is checked
- **THEN** the compiler SHALL report **E1102** once, at the second declaration, with the first declaration as the previous location, and SHALL NOT report **E1001**

#### Scenario: Same type name in sibling and nested scopes
- **GIVEN** `type Point { i64 x; }` at file level, `mod Alpha { type Point { i64 y; } mod Inner { enum Kind { Line } } enum Kind { Dot } }` and `mod Beta { enum Kind { Dot } }`
- **WHEN** the file is checked
- **THEN** no duplicate is reported

### Requirement: A module never hides a type
In a type position, only types, enums, contracts and generic parameters SHALL be candidates. A module, a function or another binding that is not a type SHALL NOT satisfy a type name and SHALL NOT hide it. When a scope declares a module or a function with the name of a type that a `use` of that scope imports, the name SHALL denote the imported type in every type position where that scope is visible, inside and outside the module.

#### Scenario: Module named like an imported type
- **GIVEN** `use Core.String.Builder;`, which imports the type `StringBuilder`, a file-level function `i64 Size(StringBuilder builder)` and `mod StringBuilder { test X { StringBuilder builder = Builder.New(); } }`
- **WHEN** the file is checked
- **THEN** both type positions resolve to the imported type and no diagnostic is reported

### Requirement: Ambiguous module qualifier
When the first segment of a qualified path names both an inline module and a `use` alias that are visible at the path, the compiler SHALL resolve the rest of the path through each of them. When both reach an item and the items differ, the compiler SHALL report **E1104** at the path and SHALL NOT select either item. When only one of them reaches an item, the path SHALL name that item.

#### Scenario: Both reach the member
- **GIVEN** `use Core.Random;`, `mod Random { pub i64 New() { return 5; } }` and a call `Random.New()`
- **WHEN** the file is checked
- **THEN** the compiler SHALL report **E1104** at `Random.New` with the message "ambiguous module `Random`: both the inline module `Random` and the import `Core.Random` declare `New`"

#### Scenario: Only the import reaches the member
- **GIVEN** `use Core.Random;`, `mod Random { test X { } }` and a call `Random.New()`
- **WHEN** the file is checked
- **THEN** `Random.New` names the function of `Core.Random` and no diagnostic is reported

### Requirement: Tests have their own namespace
A `test` item SHALL be in a namespace of its own, keyed by module and name. A test SHALL NOT be part of the item scope of its module, and no path SHALL resolve to a test. A test MAY share its name with any non-test item of the module. Two tests with the same name in one module SHALL be **E1102**.

#### Scenario: Test and function share a name
- **GIVEN** a function `Parse` and `test Parse { }` in one module
- **WHEN** the module is resolved
- **THEN** no diagnostic is reported

#### Scenario: Duplicate tests
- **GIVEN** `test Parse { }` twice in one module
- **WHEN** the module is resolved
- **THEN** the compiler SHALL report **E1102** at the second test

### Requirement: Fully qualified module paths
A path that spells a module's full name SHALL resolve without a `use`; `use` only introduces shorter names. When no import resolves the module part, it SHALL resolve only if exactly one visible unit declares that module and each declared parent module exposes the next segment with `pub mod`. Item visibility rules SHALL still apply to the final segment.

**Stable ID:** `BSP-REQ-NAME-FULLY-QUALIFIED-MODULE-PATH`

#### Scenario: Qualified call without an import
- **GIVEN** a program with no `use Core.Collections.Queue;`
- **WHEN** it calls `Core.Collections.Queue.New<i64>()`
- **THEN** the call resolves to `New` declared in module
  `Core.Collections.Queue`

#### Scenario: Qualified call beside an alias
- **GIVEN** a program that imports `Core.Output` under an alias
- **WHEN** it calls `Core.Output.WriteLine(...)` by its full path
- **THEN** the call resolves to the declared `WriteLine`; the alias only adds
  a shorter spelling

### Requirement: Fully qualified paths stay inside module visibility
A fully qualified path SHALL NOT resolve into a module that its parent declares without `pub mod`. A path whose module no visible unit declares, or that more than one visible unit declares, SHALL stay unresolved.

**Stable ID:** `BSP-REQ-NAME-FULLY-QUALIFIED-MODULE-VISIBILITY`

#### Scenario: Private module is unreachable by full path
- **GIVEN** module `Core.Text.Parser` that declares `mod Core.Text.Parser.Private;`
  without `pub`, and `Private` that declares `Hidden()`
- **WHEN** another module calls `Core.Text.Parser.Private.Hidden()`
- **THEN** the path does not resolve

### Requirement: Parameters and locals shadow method-owned fields
Inside a method, a bare name SHALL resolve to a parameter or local of that name when one is in scope, and SHALL read a field of the implicit receiver only when no parameter or local binds the name. `this.name` SHALL still read the field.

**Stable ID:** `BSP-REQ-NAME-LOCALS-SHADOW-FIELDS`

#### Scenario: Parameter shadows a field
- **GIVEN** `type Holder { string text; string Echo(string text) { return text; } }`
- **WHEN** `holder.Echo("arg")` is evaluated on a `Holder` whose field `text`
  is `"field"`
- **THEN** the result is `"arg"`

#### Scenario: Local shadows a field
- **GIVEN** `type Holder { i64 count; i64 Local() { i64 count = 7; return count; } }`
- **WHEN** `Local()` is called on a `Holder` whose field `count` is `1`
- **THEN** the result is `7`

### Requirement: Fully qualified dependency module paths
Name resolution SHALL resolve a fully qualified path without a `use` declaration when its leading segments name a public module of a package in the resolved dependency closure of the project. The host project and every dependency in the closure SHALL take part in this absolute lookup. A dependency label SHALL NOT be a segment of the path; the path SHALL use the package-native logical module path. A name in lexical scope SHALL shadow the absolute lookup: when the first segment of a path names a `use` binding, an inline module, a type, an enum or a contract that is in scope, the compiler SHALL resolve the path through that name and SHALL NOT use the absolute module lookup for it.

#### Scenario: Qualified call to a dependency module without a use declaration
- **GIVEN** an App with the `Core` dependency and no `use` declaration for `Core.Output`
- **WHEN** a function body calls `Core.Output.Write("text")` and the compiler checks the source
- **THEN** the call resolves to the public `Write` function of the Corelib module `Core.Output`
- **AND** the compiler does not report E1101 or E1108 for the path

#### Scenario: A lexical name shadows the absolute module lookup
- **GIVEN** an App with the `Core` dependency and a host module `Tools` with a public function `Run` and a host source with `use Tools as Core;`
- **WHEN** a function body calls `Core.Run()`
- **THEN** the call resolves through the `Core` use binding to `Tools.Run`
- **AND** the compiler does not look up a dependency module named `Core` for the path

#### Scenario: An inline module shadows a dependency module of the same name
- **GIVEN** a host source that declares an inline module `Testing` with a public function `Check` and an App that depends on the Corelib package that provides `Testing`
- **WHEN** the source calls `Testing.Check()`
- **THEN** the call resolves to the inline module function

### Requirement: Module path provided by more than one package
A logical module path SHALL have exactly one providing package in the resolved dependency closure. When more than one package of the closure, the host project included, provides the same logical module path, the compiler SHALL fail with **E1104**. The compiler SHALL NOT select a provider by root order or by any other preference. The diagnostic SHALL name the logical module path and each providing package with its module file, in effective root order: the host project first, then the dependencies in plan order. Two source roots that reach the same canonical module file SHALL count as one provider. One package that has more than one candidate file for a path (a flat file, a homonymous file, `mod.bd` or a generated file) SHALL count as one provider. Import-closure assembly reports this error with the provider list before semantic analysis. When an assembly that scans every source root has already admitted more than one module that declares the path, semantic legality SHALL report **E1104** at the qualified reference with the path and the number of declaring modules, and SHALL NOT bind the reference to any of them.

#### Scenario: Two dependencies provide the same module path
- **GIVEN** an App whose dependencies `alpha` and `beta` provide `Shared/Codec.bd` and `Shared/Codec/mod.bd`
- **WHEN** the App source contains `use Shared.Codec;` or a qualified call `Shared.Codec.Encode()`
- **THEN** the compiler fails with **E1104** for the path `Shared::Codec`
- **AND** the diagnostic names package `alpha` with `Shared/Codec.bd` and package `beta` with `Shared/Codec/mod.bd`, in that order

#### Scenario: Workspace-scan assembly with two declaring modules
- **GIVEN** an assembly that scans every source root and contains `Base/Output/Output.bd` from two dependencies
- **WHEN** the host source calls `Base.Output.Answer()` and `beskid check` judges it
- **THEN** the compiler reports **E1104** for the path `Base.Output` and the call has no target

#### Scenario: Host module and dependency module with the same path
- **GIVEN** an App that provides `Util.bd` and a dependency that provides `Util/Util.bd`
- **WHEN** the compiler resolves the module path `Util`
- **THEN** the compiler fails with **E1104** and names the host project first and the dependency second

#### Scenario: A hub module and a child module in different packages
- **GIVEN** a dependency `alpha` that provides `Net/Http.bd` and a dependency `beta` that provides `Net/Http/Client.bd`
- **WHEN** the compiler resolves the module paths `Net.Http` and `Net.Http.Client`
- **THEN** `Net.Http` resolves to the `alpha` file and `Net.Http.Client` resolves to the `beta` file
- **AND** the compiler does not report **E1104**

### Requirement: Private item reached through a fully qualified path
Visibility SHALL apply to a fully qualified path in the same way as to an imported name. When the last segment of a fully qualified path names an item that is not `pub` in its module and the referencing module is a different module, the compiler SHALL fail with **E1107**. The compiler SHALL NOT bind the reference to the private item.

#### Scenario: Qualified call to a private dependency function
- **GIVEN** a dependency module `Alpha.Codec` that declares a function `Normalize` without `pub`
- **WHEN** an App source calls `Alpha.Codec.Normalize()` without a `use` declaration
- **THEN** the compiler fails with **E1107** for `Normalize` in module `Alpha.Codec`

## Informative Source Provenance

The records below preserve migration history. They are not normative except where text was extracted into a requirement above.

### Source Record: Name resolution

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/language-meta/program-structure/name-resolution/`  
**Source:** `site/spec-content/platform-spec/language-meta/program-structure/name-resolution/content.md`  
**SHA-256:** `807afac546e0cc6b6c29dd6300af1ee0942ea053ae68d5d6e584bdd37f44b82e`

<details>
<summary>Migrated source text</summary>

``````markdown
## Resolution flow

```mermaid
flowchart TD
  useDecl[use declaration]
  scope[Build scope chain]
  path[Qualify path segments]
  vis[Check visibility]
  bind[Bind to symbol]
  useDecl --> scope --> path --> vis --> bind
  bind --> value[Value symbol]
  bind --> type[Type symbol]
  bind --> mod[Module re-export]
```

## Normative specification

### Scope

Defines how **identifiers** and **paths** bind to program items across modules. Module shape is in [Modules and visibility](/platform-spec/language-meta/program-structure/modules-and-visibility/).

### `use` declarations

- **`use Path;`** imports the final segment into the current scope.
- **`use Path as Alias;`** binds the resolved target to `Alias`.
- **`use` before declaration** in the same module **must** error (**E1106**) when forward reference is illegal.
- Unknown import paths **must** error (**E1105**); ambiguous imports **must** error (**E1104**).

### Value and type paths

- **Value paths** resolve to functions, locals, constants, enum constructors, and contract namespaces.
- **Type paths** resolve to types, generics, and primitive names.
- Unresolved value **E1101**; unresolved type **E1201**; unknown module segment **E1108**.

### Locals and shadowing

- Inner scopes **may** shadow outer locals; shadowing **should** warn (**W1103**).
- Duplicate definitions in the same scope **must** error once, with **E1102**.

### Static rules

- Resolution **must** respect visibility from the importer’s module.
- Generic parameters shadow type names in signature scope only for the declaring signature.

### Dynamic semantics

Resolution is compile-time; emitted metadata records stable `qualifiedName` strings for tooling.

### Diagnostics

Import band **E1104–E1108**; resolve duplicates **E1102**. Registry: [Diagnostic code registry](/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/).

### Conformance

**L1** resolver tests **must** pass for cross-module `use` and private item rejection.

## Decisions
<!-- spec:generate:adr-index -->
No ADRs published under **`adr/`** yet.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Name resolution - Contracts and edge cases](./articles/contracts-and-edge-cases/)
- [Name resolution - Design model](./articles/design-model/)
- [Name resolution - Examples](./articles/examples/)
- [Name resolution - FAQ and troubleshooting](./articles/faq-and-troubleshooting/)
- [Name resolution - Flow and algorithm](./articles/flow-and-algorithm/)
- [Name resolution - Verification and traceability](./articles/verification-and-traceability/)
<!-- /spec:generate:article-index -->
``````

</details>

### Source Record: Name resolution - Contracts and edge cases

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/language-meta/program-structure/name-resolution/articles/contracts-and-edge-cases/`  
**Source:** `site/spec-content/platform-spec/language-meta/program-structure/name-resolution/articles/contracts-and-edge-cases/content.md`  
**SHA-256:** `f88861546f048ccbcc0f3ac9cd54e37db1efb5aa9ecb593d67495cbfde5e9eca`

<details>
<summary>Migrated source text</summary>

``````markdown
## Hard requirements

- **Single resolver graph** — Package driver and typechecker share one resolution snapshot per compilation.
- **Contract namespaces** — Contracts may appear as path prefixes for static methods.
- **Qualified names for tooling** — Emitted `qualifiedName` strings must be stable across compiles.
- **No implicit `null` imports** — Resolution must not inject nullable or `optional` aliases.

## Diagnostic band E11xx

| Code | Condition |
| --- | --- |
| **E1101** | Unknown value |
| **E1102** | Duplicate item or local |
| **E1104** | Ambiguous import |
| **E1105** | Unknown import path |
| **E1106** | Use before declaration |
| **E1107** | Private item access |
| **E1108** | Unknown module path |
| **W1103** | Shadowed local |

## Edge cases

- **Forward reference** — `use` before declaration in the same module emits **E1106** when forward reference is illegal.
- **Generic parameter shadowing** — Generic parameters shadow type names in signature scope only for the declaring signature.
- **Self-referential type** — A type may reference itself in its own field types; resolution handles this via deferred binding.
- **Import cycle** — Circular `use` dependencies are allowed as long as no forward references are used.

## Invariants

- Resolution must respect visibility from the importer's module.
- Every resolved symbol must have a stable `qualifiedName` for tooling.
- Re-resolution on incremental edits must produce the same result as full compilation for unchanged sites.
``````

</details>

### Source Record: Name resolution - Design model

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/language-meta/program-structure/name-resolution/articles/design-model/`  
**Source:** `site/spec-content/platform-spec/language-meta/program-structure/name-resolution/articles/design-model/content.md`  
**SHA-256:** `625540a458db9b7eb2f0ff6197b6a3f4de5628c7e20719c20374ca6718b694ce`

<details>
<summary>Migrated source text</summary>

``````markdown
## Vocabulary

| Construct | Role |
| --- | --- |
| **`Resolver`** | Central name resolution state |
| **`Scope`** | Hierarchical binding container |
| **`ValuePath`** | Path resolving to functions, locals, constants, enum constructors |
| **`TypePath`** | Path resolving to types, generics, primitives |

## Resolution architecture

Name resolution is **single-pass** with a shared snapshot per compilation. The package driver and typechecker share one resolver graph.

```mermaid
flowchart LR
    use[use declarations]
    scope[Build scope chain]
    path[Qualify path segments]
    vis[Check visibility]
    bind[Bind to symbol]
    use --> scope --> path --> vis --> bind
```

### Subsystem boundaries

| Subsystem | Responsibility | Key file |
| --- | --- | --- |
| Parser | Parse `use` and paths | `syntax/items/use_declaration.rs` |
| Resolver | Build scope chain and bind names | `resolve/resolver.rs`, `resolve/collect.rs` |
| Resolve refs | Walk AST and resolve references | `resolve/resolve_refs.rs` |
| Name resolution rules | Emit resolution diagnostics | `analysis/rules/staged/name_resolution.rs` |

## Scope chain

Resolution walks from innermost scope outward:
1. Local scope (function/lambda parameters and `let` bindings)
2. Module scope (items in the current module)
3. Import scope (`use` bindings)
4. Global scope (prelude and built-in types)

## Shadowing

Inner scopes may shadow outer locals. `ResolveShadowedLocal` (**W1103**) warns when shadowing occurs.
``````

</details>

### Source Record: Name resolution - Examples

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/language-meta/program-structure/name-resolution/articles/examples/`  
**Source:** `site/spec-content/platform-spec/language-meta/program-structure/name-resolution/articles/examples/content.md`  
**SHA-256:** `72fef604ef0b39ed9a79e4bb87dff7bb942087f125de820a48fcf8dfad43b952`

<details>
<summary>Migrated source text</summary>

``````markdown
## Basic resolution

```beskid
unit Main() {
    let x = 42;
    Console.WriteLine(x);   // resolves local x
}
```

## Import and alias

```beskid
use MyApp.Models.User;
use MyApp.Services.UserService as Service;

unit UseImports() {
    let u = User {};
    let s = Service {};
}
```

## Shadowing

```beskid
unit Shadow() {
    let x = 10;
    {
        let x = 20;   // shadows outer x; W1103 warned
        Console.WriteLine(x);   // 20
    }
    Console.WriteLine(x);   // 10
}
```

## Contract namespace

```beskid
contract Math {
    i32 Abs(i32 value);
}

unit UseNamespace() {
    let n = Math.Abs(-5);   // resolves through contract namespace
}
```

## Qualified path

```beskid
unit Qualified() {
    let u = MyApp.Models.User {};   // fully qualified path
}
```
``````

</details>

### Source Record: Name resolution - FAQ and troubleshooting

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/language-meta/program-structure/name-resolution/articles/faq-and-troubleshooting/`  
**Source:** `site/spec-content/platform-spec/language-meta/program-structure/name-resolution/articles/faq-and-troubleshooting/content.md`  
**SHA-256:** `2131dc5e8e3e2649f762ddbc134c1f00d3247f192c1201c09618549c1b201a1a`

<details>
<summary>Migrated source text</summary>

``````markdown
## Locked decisions

| Decision | ID | Summary |
| --- | --- | --- |
| Single resolver graph | D-LM-NAME-001 | Driver and typechecker share one snapshot |
| Contract namespaces | D-LM-NAME-002 | Contracts as path prefixes for static methods |
| Qualified names for tooling | D-LM-NAME-003 | Stable across compiles |
| No implicit `null` imports | D-LM-NAME-004 | No nullable aliases injected |

## FAQ

### Why is my import not found?

Check that the path is correct and the target item is `pub`. `UnknownImportPath` (**E1105**) means the path does not resolve to any module or item.

### Can I use a type before it is declared?

No. Forward references within the same module emit **E1106** unless the reference is in a type signature (which may be resolved in a second pass).

### What does "shadowed local" mean?

An inner `let` binding has the same name as an outer one. The inner binding takes precedence. **W1103** warns about this.

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| **E1101** | Unknown value name |
| **E1201** | Unknown type name |
| **E1102** | Duplicate name in same scope |
| **E1105** | Import path does not exist |
| **E1106** | Forward reference in same module |
| **E1107** | Accessing private item |
| **W1103** | Inner binding shadows outer |
``````

</details>

### Source Record: Name resolution - Flow and algorithm

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/language-meta/program-structure/name-resolution/articles/flow-and-algorithm/`  
**Source:** `site/spec-content/platform-spec/language-meta/program-structure/name-resolution/articles/flow-and-algorithm/content.md`  
**SHA-256:** `387b4a9670ed8178596b20c0763f334c39e8a463255759c50e8618ffb80b0161`

<details>
<summary>Migrated source text</summary>

``````markdown
## Compile pipeline placement

```mermaid
flowchart LR
    parse[parse]
    collect[collect definitions]
    resolve[resolve refs]
    typecheck[type check]
    lower[lower to HIR]
    parse --> collect --> resolve --> typecheck --> lower
```

## Resolution algorithm (normative)

1. **Collect definitions** — Walk all items and build a name-to-definition map per module scope.
2. **Process imports** — Resolve `use` paths and add imported names to the module scope. `UnknownImportPath` (**E1105**) for invalid paths.
3. **Build scope chain** — For each function/lambda, create a local scope with parameters and `let` bindings.
4. **Resolve value paths** — Walk expressions and bind identifiers to value symbols. `ResolveUnknownValue` (**E1101**) for unresolved names.
5. **Resolve type paths** — Walk type expressions and bind identifiers to type symbols. `ResolveUnknownType` (**E1201**) for unresolved types.
6. **Check visibility** — Verify that resolved symbols are accessible from the reference site. `ResolvePrivateItemInModule` (**E1107**) for private access.
7. **Check duplicates** — `ResolveDuplicateItem` (**E1102**) and `ResolveDuplicateLocal` (**E1102**) for duplicate names in the same scope.
8. **Handle shadowing** — `ResolveShadowedLocal` (**W1103**) warns when an inner binding shadows an outer one.

## Path resolution

```mermaid
flowchart TB
    path[Path segments]
    first[Resolve first segment]
    rest[Qualify remaining segments]
    bind[Bind to symbol]
    path --> first --> rest --> bind
```

## Contract namespaces

Contracts may appear as path prefixes for static-style calls (`Contract.method()`). The resolver provides contract-as-namespace fallback when a direct value binding is not found.

## LSP / incremental

Re-run resolution when `use` declarations, item definitions, or local bindings change.
``````

</details>

### Source Record: Name resolution - Verification and traceability

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/language-meta/program-structure/name-resolution/articles/verification-and-traceability/`  
**Source:** `site/spec-content/platform-spec/language-meta/program-structure/name-resolution/articles/verification-and-traceability/content.md`  
**SHA-256:** `dc4417d1d251e08c00b8acedb71eb70de4e9b7739486d40336fbf1aa045b29bf`

<details>
<summary>Migrated source text</summary>

``````markdown
## Verification matrix

| Scenario | Expected evidence |
| --- | --- |
| Local resolution | Identifier binds to local declaration |
| Import resolution | `use` path resolves to exported symbol |
| Duplicate name | **E1102** emitted |
| Unknown name | **E1101** or **E1201** emitted |
| Private access | **E1107** emitted |
| Shadowing | **W1103** warned |

## Implementation checklist

- [x] Grammar: identifiers, paths, `use`
- [x] AST: `UseDeclaration`, path expressions
- [x] Parser: `beskid.pest` productions for paths
- [x] Resolver: `resolver.rs`, `collect.rs`, `resolve_refs.rs`
- [x] Name resolution rules: `name_resolution.rs`
- [x] Diagnostics: **E1101–E1108**, **W1103**
- [x] Cross-package resolution (assembly prefetch + `ModuleIndex`)
- [x] Stable package-prefixed symbol identity for tooling (`SymbolRegistry`, `symbolKey`) — see [resolver contract](/platform-spec/compiler/semantic-pipeline/resolver-contract/)

## Test locations

- `compiler/crates/beskid_analysis/src/resolve/resolver.rs` — resolver tests
- `compiler/crates/beskid_analysis/src/resolve/resolve_refs.rs` — reference tests
- `compiler/crates/beskid_analysis/src/analysis/rules/staged/name_resolution.rs` — rule tests
- `compiler/crates/beskid_tests` — integration tests for resolution
``````

</details>
