## ADDED Requirements

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
A logical module path SHALL have exactly one providing package in the resolved dependency closure. When more than one package of the closure, the host project included, provides the same logical module path, the compiler SHALL fail with **E1104**. The compiler SHALL NOT select a provider by root order or by any other preference. The diagnostic SHALL name the logical module path and each providing package with its module file, in effective root order: the host project first, then the dependencies in plan order. Two source roots that reach the same canonical module file SHALL count as one provider. One package that has more than one candidate file for a path (a flat file, a homonymous file, `mod.bd` or a generated file) SHALL count as one provider.

#### Scenario: Two dependencies provide the same module path
- **GIVEN** an App whose dependencies `alpha` and `beta` provide `Shared/Codec.bd` and `Shared/Codec/mod.bd`
- **WHEN** the App source contains `use Shared.Codec;` or a qualified call `Shared.Codec.Encode()`
- **THEN** the compiler fails with **E1104** for the path `Shared::Codec`
- **AND** the diagnostic names package `alpha` with `Shared/Codec.bd` and package `beta` with `Shared/Codec/mod.bd`, in that order

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
