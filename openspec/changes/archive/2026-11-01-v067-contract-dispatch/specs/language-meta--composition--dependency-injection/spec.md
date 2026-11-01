## ADDED Requirements

### Requirement: Injection of contract values
An `inject` field of contract type SHALL receive a contract value that holds the registered implementation. A singular `inject` of a contract MAY bind a different implementation in each scope. An `inject Contract[]` field SHALL receive a contract value for each registration, in registration order. The rules for E1704 and E1705 SHALL stay unchanged.

#### Scenario: Different implementation per scope
- **GIVEN** a `Logger` contract, a global registration of `ConsoleLogger` and a scope `Request` that registers `RequestLogger`
- **WHEN** a service in each scope injects `Logger logger;`
- **THEN** the service in the global scope receives `ConsoleLogger` and the service in `Request` receives `RequestLogger`
