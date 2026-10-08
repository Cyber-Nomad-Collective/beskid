## ADDED Requirements

### Requirement: Package-native logical module paths
Program assembly SHALL derive the logical module path of a source unit only from its location under its source root. The host project's modules SHALL have no prefix. Each Corelib package SHALL keep its own module roots, for example `Core.*`, `Testing.*`, `Concurrency.*` and `Beskid.Compiler.*`. No dependency label, package name or project kind SHALL add a segment to a logical module path. Beskid SHALL NOT have a `Std` module namespace, and assembly SHALL NOT register an alias that resolves a `Std.`-qualified path. A `use` declaration whose path starts with `Std` SHALL fail with E1105, and a qualified module path that starts with `Std` SHALL fail with E1108. The diagnostic message SHALL state that the `Std` namespace does not exist, and its help SHALL name the package-native replacement path.

#### Scenario: Host modules are unprefixed with the Core dependency
- **GIVEN** an App with the `Core` dependency and a source file `Src/Helpers.bd`
- **WHEN** program assembly infers the module path of that file
- **THEN** the logical module path is `Helpers`

#### Scenario: Corelib modules keep package-native paths
- **GIVEN** an App with the `Core` dependency
- **WHEN** program assembly infers the module paths of Corelib `Core/Output/Output.bd`, `Testing/Assert.bd` and `Concurrency/Fiber.bd`
- **THEN** the paths are `Core.Output`, `Testing.Assert` and `Concurrency.Fiber`
- **AND** `use Core.Output;` resolves in the App

#### Scenario: A Std-qualified import names its replacement
- **GIVEN** an App source with `use Std.Core.Output;`
- **WHEN** the compiler checks the source
- **THEN** it reports E1105 with the message "unknown import path `Std.Core.Output`: the `Std` namespace does not exist"
- **AND** the help names `Core.Output` as the replacement

#### Scenario: A Std-qualified type path does not resolve
- **GIVEN** an App source with a parameter of type `Std.Core.Results.Widget`
- **WHEN** the compiler resolves the parameter type
- **THEN** the type reference stays unresolved and no `Std` alias makes it resolve
