## ADDED Requirements

### Requirement: Contract methods declare default parameters
A contract method MAY declare default values for its parameters under the rules of default parameter values. A call through a contract bound or a contract-typed value SHALL use the defaults of the contract. An implementation method SHALL have the same signature as the contract method, including its optional parameters, and SHALL NOT declare a default value of its own for a parameter of the contract method. An implementation that declares one SHALL be **E1602**.

#### Scenario: Default through a bound
- **GIVEN** `contract Writer { unit Write(string text, bool newline = true); }` and a function `unit Emit<T>(T w) where T: Writer { w.Write("a"); }`
- **WHEN** the function is specialized
- **THEN** the call passes `true` for `newline`
