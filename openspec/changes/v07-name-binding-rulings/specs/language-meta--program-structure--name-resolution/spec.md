## MODIFIED Requirements

### Requirement: Use declaration resolution and diagnostics
`use Path;` SHALL bind the final segment of `Path` in the current source unit. When `Path` names a module, the segment SHALL bind that module as an alias. When `Path` names no module and its leading segments name a module that declares a `pub` item with the final segment's name, the segment SHALL bind that item in the item's position kind (type or value). When `Path` names a module and also an item, the module binding SHALL win. `use Path as Alias;` SHALL bind the resolved target to `Alias`. A `use` of an item that is not `pub` SHALL fail with **E1107**. An import path that names neither a module nor an item SHALL fail with **E1105**, and no other code SHALL be reported for it. A `use` path whose module has more than one providing source unit SHALL fail with **E1104**. Two `use` declarations of one source unit that bind the same name SHALL fail with **E1102**, reported once, whether or not their targets differ. `use` declarations SHALL be order-free: their position among the items of a unit and the order of units SHALL NOT change any binding. **E1106** SHALL NOT be reported for a `use` declaration.

#### Scenario: Unknown import path
- **GIVEN** a `use` declaration whose path does not resolve to any module or item
- **WHEN** name resolution processes imports
- **THEN** the compiler emits **E1105** and does not bind the import
- **AND** the compiler does not also emit **E1108** for the path

#### Scenario: Use of a public item
- **GIVEN** a module `Concurrency.Channel` that declares `pub unit SendOk(i64 value)` and a unit with `use Concurrency.Channel.SendOk;`
- **WHEN** a function body of that unit calls `SendOk(1)`
- **THEN** the call binds to `SendOk` of module `Concurrency.Channel`

#### Scenario: Use of a private item
- **GIVEN** a module `Codec` that declares `unit Normalize()` without `pub` and another unit with `use Codec.Normalize;`
- **WHEN** name resolution processes the import
- **THEN** the compiler emits **E1107** and does not bind `Normalize`

#### Scenario: Module wins over a homonymous item
- **GIVEN** a module `Concurrency` that declares `pub type Channel` and a module `Concurrency.Channel`
- **WHEN** a unit declares `use Concurrency.Channel;`
- **THEN** `Channel` binds the module `Concurrency.Channel`

#### Scenario: Duplicate import name
- **GIVEN** a unit with `use Alpha.Codec;` and `use Beta.Codec;`
- **WHEN** name resolution processes imports
- **THEN** the compiler emits **E1102** once for `Codec`

#### Scenario: Import order has no effect
- **GIVEN** a unit whose `use Tools;` follows the function that calls `Tools.Run()`
- **WHEN** the unit is resolved
- **THEN** the call binds to `Run` of module `Tools`

### Requirement: Visibility, duplicates, and shadowing
Resolution SHALL respect visibility from the referencing source unit; access to a private item of another source unit SHALL fail with **E1107**. A duplicate binding in one scope (the item namespace of a module, the member set of a type, or one local scope) SHALL fail with **E1102**, reported once per duplicate. Inner scopes MAY shadow outer locals. A local or parameter that shadows a local or parameter of an enclosing scope SHOULD warn with **W1103**. A local that shadows an item, a constant, an import or a builtin SHALL NOT warn. A generic parameter SHALL shadow a type of the same name in the signature and body of its declaration.

#### Scenario: Private item accessed across modules
- **GIVEN** a reference from module A to a non-`pub` item in module B
- **WHEN** visibility checking runs during resolution
- **THEN** the compiler emits **E1107**

#### Scenario: Duplicate item reported once
- **GIVEN** one source unit that declares `pub type A {}` and `unit A() {}`
- **WHEN** the unit is resolved
- **THEN** the compiler emits **E1102** once for `A` and no other duplicate code

#### Scenario: Local shadows a local
- **GIVEN** `unit F(i64 x) { if true { let x = 2; } }`
- **WHEN** the function is resolved
- **THEN** the compiler warns **W1103** for the inner `x`

#### Scenario: Local shadows an item without a warning
- **GIVEN** a unit that declares `unit Run() {}` and a function body with `let Run = 1;`
- **WHEN** the function is resolved
- **THEN** the compiler does not warn **W1103**

### Requirement: Single resolver snapshot and stable qualified names
The compiler SHALL have one name-binding authority: the generation-bound semantic query facts. `beskid check`, typing, codegen, the language server, `beskid doc` and every rule stage SHALL read bindings from those facts and SHALL NOT compute bindings with a second resolver. Emitted metadata SHALL record stable `qualifiedName` strings for tooling across compiles, derived from the binding facts. Resolution SHALL NOT inject nullable or `optional` aliases as implicit imports.

#### Scenario: Shared resolution snapshot
- **GIVEN** a multi-module compilation
- **WHEN** the package driver and typechecker consult name bindings
- **THEN** both consume the same resolution snapshot and each resolved symbol has a stable `qualifiedName`

#### Scenario: Editor navigation agrees with the compiler
- **GIVEN** a call that `beskid check` binds to function `Run` of module `Tools`
- **WHEN** the language server answers go-to-definition for that call
- **THEN** it returns the declaration of `Tools.Run`

## ADDED Requirements

### Requirement: Module item namespace
The top-level declarations of a module (functions, types, enums, contracts, tests, inline modules and module declarations) SHALL share one item namespace for uniqueness: two declarations of one name in one module SHALL fail with **E1102**. Lookup SHALL be filtered by position. A type position SHALL consider generic parameters, types, enums and contracts. A value position SHALL consider locals, functions and constants. A declaration of the source unit SHALL shadow an imported name only in its own position kind.

#### Scenario: Local function does not hide an imported type
- **GIVEN** a unit with `use Shapes;`, where `Shapes` declares `pub type Box`, and the unit declares `unit Box() {}`
- **WHEN** a parameter of that unit is declared as `Box b`
- **THEN** the parameter type binds to `Shapes.Box`

### Requirement: One source unit per logical module path
A logical module path SHALL have exactly one source unit in the program assembly, together with at most one generated companion. A file `X.g.bd` in the directory of `X.bd` SHALL be the generated companion of `X.bd` and SHALL provide the same logical module; the primary and its companion SHALL form one module scope, so items of either file bind unqualified in both, and one name declared in both files SHALL fail with **E1102**. `use` declarations SHALL apply only to the file that declares them. A companion without its primary SHALL fail with **E1105**, and a file-scoped `mod` in a companion that names another path SHALL fail with **E1104**. When a second source unit has the same logical module path, by its file location or by a file-scoped `mod` declaration, the compiler SHALL fail with **E1104** at the module identity of the second unit and at every reference to that path, and SHALL NOT merge the units into one scope. Candidate files of one package for one path (a flat file, a homonymous file, `mod.bd` or a generated file) SHALL count as one provider. A module SHALL exist only when a source unit provides it; an intermediate path segment that no unit provides SHALL NOT be a module. The entry unit SHALL be an ordinary unit of its logical module; its items SHALL NOT also bind at the root module.

#### Scenario: Two units declare one module path
- **GIVEN** `src/A.bd` and `src/B.bd` of one package that both begin with `mod Shared;`
- **WHEN** the compiler checks the package
- **THEN** it emits **E1104** for the module path `Shared`

#### Scenario: Generated companion shares the module
- **GIVEN** `src/Shapes.bd` with `pub type Box {}` and `src/Shapes.g.bd` with `pub unit Describe(Box b) {}`
- **WHEN** another unit declares `use Shapes;` and calls `Shapes.Describe(box)`
- **THEN** the call binds to `Describe` without a diagnostic

#### Scenario: Companion without a primary
- **GIVEN** `src/Orphan.g.bd` and no `src/Orphan.bd`
- **WHEN** the compiler checks the package
- **THEN** it emits **E1105** for the module path `Orphan`

#### Scenario: Intermediate path is not a module
- **GIVEN** a package with `Net/Http/Client.bd` and no unit for `Net.Http`
- **WHEN** a unit declares `use Net.Http;`
- **THEN** the compiler emits **E1105**

#### Scenario: Entry items are not root items
- **GIVEN** an entry unit `Main.bd` that declares `unit Log() {}` and a unit `Tools.bd` without `use Main;`
- **WHEN** `Tools.bd` calls `Log()`
- **THEN** the compiler emits **E1101**

### Requirement: Unit-scoped imports
A `use` declaration SHALL bind names only in the source unit that contains it. Sibling units of the same parent module and child modules SHALL NOT see the binding. `use M;` SHALL make the `pub` functions, types, enums and contracts of `M` nameable unqualified in that unit, below the unit's own declarations. When two imported items of one position kind provide one unqualified name and no declaration of the unit has that name, a reference to the name SHALL fail with **E1104** that names both candidates; the compiler SHALL NOT choose one, and SHALL NOT report an error when the name is not referenced. There SHALL be no implicit `Core` alias; the absolute module lookup reaches `Core.*` paths.

#### Scenario: Import does not leak to a child module
- **GIVEN** `A.bd` with `use Core.Output;` and `A/Child.bd` without a `use`
- **WHEN** `A/Child.bd` calls `WriteLine("x")`
- **THEN** the compiler emits **E1101**

#### Scenario: Two imports provide one name
- **GIVEN** a unit with `use Alpha;` and `use Beta;`, where both modules declare `pub unit Run()`
- **WHEN** the unit calls `Run()`
- **THEN** the compiler emits **E1104** for `Run` and names `Alpha.Run` and `Beta.Run`

#### Scenario: Unused ambiguous name
- **GIVEN** a unit with `use Alpha;` and `use Beta;`, where both modules declare `pub unit Run()`
- **WHEN** the unit never references `Run`
- **THEN** the compiler emits no ambiguity error

### Requirement: Unqualified value name order
An unqualified value name SHALL bind at the first of these levels that has a match: (1) locals and parameters, innermost scope first; (2) inside an inline method of a type, the fields and sibling methods of the receiver type; (3) items and constants of the source unit, the nearest enclosing inline module first, then outward to the unit's top level; (4) names imported into the source unit; (5) builtins. Two matches on one level SHALL fail with **E1104**. Unqualified lookup SHALL NOT reach items of parent modules or of other source units of the same parent module; those require a `use` or a qualified path. A local, item or import of the same name as a builtin SHALL shadow the builtin and SHALL NOT be a duplicate.

#### Scenario: Field before constant
- **GIVEN** `const limit = 4;` and `type Pool { i64 limit, i64 Get() { return limit; } }` in one unit
- **WHEN** `Get` is resolved
- **THEN** `limit` binds to the field of the receiver

#### Scenario: Parent module items need an import
- **GIVEN** `Net.bd` that declares `pub unit Trace() {}` and `Net/Http.bd` without a `use`
- **WHEN** `Net/Http.bd` calls `Trace()`
- **THEN** the compiler emits **E1101**

#### Scenario: Item shadows a builtin
- **GIVEN** a unit that declares `unit Panic(string message) {}` while `Panic` is a builtin
- **WHEN** the unit calls `Panic("x")`
- **THEN** the call binds to the unit's `Panic` and no **E1102** is reported

### Requirement: Local binding scopes
A `let` binding SHALL be in scope from the end of its statement to the end of the enclosing block; its own initializer SHALL NOT see it. A reference to a name that a later `let` of the same block declares SHALL bind the nearest earlier binding of that name. When no earlier binding exists, the compiler SHALL fail with **E1106** (use before declaration) instead of **E1101**.

#### Scenario: Initializer sees the outer binding
- **GIVEN** `unit F(i64 x) { let x = x + 1; }`
- **WHEN** the function is resolved
- **THEN** the `x` in the initializer binds to the parameter

#### Scenario: Later let with an earlier binding
- **GIVEN** `unit F(i64 x) { let y = x; let x = 2; }`
- **WHEN** the function is resolved
- **THEN** the `x` in `let y = x;` binds to the parameter and no **E1106** is reported

#### Scenario: Later let without an earlier binding
- **GIVEN** `unit F() { let y = z; let z = 2; }`
- **WHEN** the function is resolved
- **THEN** the compiler emits **E1106** for `z`

### Requirement: Type name lookup
A single-segment type name SHALL bind at the first of these levels that has a match: (1) generic parameters of the enclosing declarations; (2) types, enums and contracts of the source unit, the nearest enclosing inline module first, then outward; (3) types imported into the source unit; (4) the homonymous item of a module alias. Lookup SHALL NOT fall back to a type of another inline module of the unit. Lookup SHALL use the name only. When the bound type's generic arity differs from the written type arguments, the compiler SHALL fail with **E1203** or **E1204**, not **E1201**.

#### Scenario: Generic parameter shadows a type
- **GIVEN** a unit that declares `type T {}` and `T Id<T>(T value) { return value; }`
- **WHEN** `Id` is resolved
- **THEN** each `T` in the signature and body of `Id` binds to the generic parameter

#### Scenario: Arity mismatch
- **GIVEN** a unit that declares `pub type Box { i64 v, }` and a parameter `Box<i64> b`
- **WHEN** the parameter type is resolved
- **THEN** the compiler emits **E1203** or **E1204** for `Box`

#### Scenario: No fallback into a sibling inline module
- **GIVEN** a unit with `mod a { pub type Node {} }` and `mod b { unit F(Node n) {} }`
- **WHEN** `F` is resolved
- **THEN** the compiler emits **E1201** for `Node`

### Requirement: Qualified path forms
A qualified path SHALL bind by these forms only. `M.N` SHALL bind item `N` of module `M`, where `M` is a `use` alias, an inline module in lexical scope, or an absolute module path. `T.F` and `M.T.F` SHALL bind function `F` when `T` names exactly one type or enum of module `M` (or of the current unit) with the written arity and `F` is a function of that module that is accessible from the reference; a type segment SHALL NOT be skipped. A member call whose target path does not start with a local SHALL be resolved as one qualified path; when the first segment is a local, the path SHALL be a field chain. A qualified call that binds no declaration SHALL fail with **E1101** (the module has no such member) or **E1108** (no such module); the compiler SHALL NOT lower it as a dynamic call. A non-generic function reached through a qualified path and read as a value SHALL be a function value; a type, enum, contract or module read as a value SHALL fail with **E1201**.

#### Scenario: Type-qualified function in the declaring unit
- **GIVEN** `Concurrency/Channel.bd` that declares `pub type Channel<T>` and `pub Channel<T> Create<T>()`
- **WHEN** a function of that unit calls `Channel.Create<i64>()`
- **THEN** the call binds to `Create` of module `Concurrency.Channel`

#### Scenario: Fully qualified type-qualified function
- **GIVEN** the same module and another unit
- **WHEN** that unit calls `Concurrency.Channel.Channel.Create<i64>()`
- **THEN** the call binds to `Create` of module `Concurrency.Channel`

#### Scenario: Unknown member of an imported module
- **GIVEN** a unit with `use Codec;` where `Codec` declares no `Missing`
- **WHEN** the unit calls `Codec.Missing()`
- **THEN** the compiler emits **E1101** and the call is not lowered

#### Scenario: Qualified function as a value
- **GIVEN** a module `MathUtil` with `pub i64 Double(i64 x)` and `i64 Apply(i64 v, (i64) => i64 f)`
- **WHEN** a unit evaluates `Apply(4, MathUtil.Double)`
- **THEN** `MathUtil.Double` is a function value of `Double`

#### Scenario: Type read as a value
- **GIVEN** a module `Shapes` with `pub type Box {}`
- **WHEN** a unit evaluates `let b = Shapes.Box;`
- **THEN** the compiler emits **E1201**

### Requirement: Constant names
An integer constant SHALL follow the item visibility rule: `const N = 1;` without `pub` SHALL be private to its source unit, and `pub const N = 1;` SHALL be visible in every source unit that imports its module. A reference from another source unit to a constant without `pub` SHALL fail with **E1107**. Inside the canonical runtime corpus, the private corpus scope SHALL still share constants without `pub`. An unqualified constant name SHALL bind at level 3 of the value order when the unit declares it, and at level 4 when an imported module declares it as `pub`. When imported modules declare one public constant name with distinct values, a reference SHALL fail with **E1104**; equal values SHALL count as one constant.

#### Scenario: Imported public constant
- **GIVEN** `Limits.bd` with `pub const MaxFrame = 16384;` and `Codec.bd` with `use Limits;`
- **WHEN** `Codec.bd` reads `MaxFrame`
- **THEN** the value is 16384

#### Scenario: Private constant of another unit
- **GIVEN** `Limits.bd` with `const MaxFrame = 16384;` without `pub` and `Codec.bd` with `use Limits;`
- **WHEN** `Codec.bd` reads `Limits.MaxFrame`
- **THEN** the compiler emits **E1107**

#### Scenario: Conflicting imported constants
- **GIVEN** a unit that imports two modules that declare `pub const Limit = 1;` and `pub const Limit = 2;`
- **WHEN** the unit reads `Limit`
- **THEN** the compiler emits **E1104**

### Requirement: Import usage diagnostics
A `use` declaration that no reference of its unit uses SHALL warn with **W1503**. A reference SHALL credit an import when it uses the import's binding name or alias, an unqualified name that the import provides, or a qualified path through the imported module (including the module's homonymous item). The credit SHALL go to the import that declares the binding, not to a re-exporting module. When a single-segment name is unresolved and names the last segment of a known module, the compiler MAY add help that suggests the `use` declaration; the help SHALL NOT change a binding.

#### Scenario: Unused import
- **GIVEN** a unit with `use Core.Output;` and no reference to `Output` or its items
- **WHEN** the unit is checked
- **THEN** the compiler warns **W1503** for the import

#### Scenario: Import credited through a qualified path
- **GIVEN** a unit with `use Concurrency.Channel;` that calls `Channel.Create<i64>()`
- **WHEN** the unit is checked
- **THEN** the compiler does not warn **W1503**

### Requirement: Names in macro expansions
Items and references produced by macro expansion SHALL belong to the module of the macro invocation site and SHALL resolve by the ordinary rules of this capability. The compiler SHALL NOT bind an expanded reference by searching the unit for a unique function of that name.

#### Scenario: Expanded call inside an inline module
- **GIVEN** a macro invocation inside `mod tools { }` that expands to a call `Helper()`, and `Helper` is declared only in another inline module of the unit
- **WHEN** the expansion is resolved
- **THEN** the compiler emits **E1101** for `Helper`
