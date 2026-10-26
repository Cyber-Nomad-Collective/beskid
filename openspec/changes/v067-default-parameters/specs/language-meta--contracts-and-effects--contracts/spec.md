## ADDED Requirements

### Requirement: Contract methods declare default parameters
A contract method MAY declare default values for its parameters under the rules of default parameter values. The default values belong to the contract declaration. A method that implements a contract method (same name and parameter count, in `type X : C` or `impl X : C`) and declares no optional parameter SHALL have the default values of the contract method. A call through a contract bound or a contract-typed value SHALL use the defaults of the contract. An implementing method that declares a default value different from the one of the contract method, or where the contract method has none, SHALL be **E1612**. Repeating the same default value SHALL be allowed.

#### Scenario: Default through a bound
- **GIVEN** `contract Writer { unit Write(string text, bool newline = true); }` and a function `unit Emit<T>(T w) where T: Writer { w.Write("a"); }`
- **WHEN** the function is specialized
- **THEN** the call passes `true` for `newline`

#### Scenario: Inherited default
- **GIVEN** `contract Writer { unit Write(string text, bool newline = true); }` and `impl Console : Writer { pub unit Write(string text, bool newline) { ... } }`
- **WHEN** the code calls `console.Write("a")`
- **THEN** the call passes `true` for `newline`

#### Scenario: Different default
- **GIVEN** the same contract and an implementation that declares `bool newline = false`
- **WHEN** the implementation is checked
- **THEN** the compiler SHALL report **E1612**
