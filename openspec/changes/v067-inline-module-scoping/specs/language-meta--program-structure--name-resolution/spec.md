## ADDED Requirements

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
The compiler SHALL compare the names of functions, module declarations, inline modules, constants and `use` aliases for duplicates in one scope only: the file scope or one inline module. The same name in two different scopes SHALL NOT be a duplicate. Each duplicate in one scope SHALL be reported exactly once, as **E1102**, at the later declaration: two functions, two `use` aliases, a `use` alias and a function, two module declarations, two constants, or two tests with the same name in one module. A duplicate SHALL NOT also be reported as **E1006** or **E1104**.

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
