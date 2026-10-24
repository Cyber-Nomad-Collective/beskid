## ADDED Requirements

### Requirement: Host hook order
The runtime SHALL run host hooks in this order. At `launch`, the global-scope `init` hooks SHALL run first, and then the `startup` hooks, after the container has started. When a `with` block enters a named scope, the `init` hooks of that scope SHALL run after the scope is entered. When a `with` block exits by any path, including normal end, `return`, `break` and `continue`, the `dispose` hooks of that scope SHALL run before the scope is left; they SHALL run only for an activation whose `init` completed. When the launch lifetime ends, the global `dispose` hooks SHALL run before the container shuts down. In a host chain, `init` and `startup` hooks SHALL run base host first, and `dispose` hooks SHALL run the launched host first. A `startup` hook declared inside a named scope SHALL be **E1717**.

#### Scenario: Order at launch
- **GIVEN** a host with a global `init`, a `startup` and a global `dispose`
- **WHEN** the program launches the host and the launch lifetime ends
- **THEN** the hooks run in the order `init`, `startup`, `dispose`, and `dispose` runs before the container shuts down

#### Scenario: Dispose on every exit
- **GIVEN** a `with` block whose body contains `return`, `break` or `continue`
- **WHEN** the block exits by that path
- **THEN** the scope `dispose` hook runs once before the scope is left

#### Scenario: Startup in a scope
- **GIVEN** a `startup` hook declared inside a named scope
- **WHEN** the host is checked
- **THEN** the compiler SHALL report **E1717**

### Requirement: Registration shape rules
A registered service SHALL have only `inject` fields, because the container creates it without a constructor. The compiler SHALL report **E1718** when a contract is registered as itself, with a fix. The compiler SHALL report **E1719** when a registered type is one that the container cannot create: a type with a value field, a generic type, or an enum. The compiler SHALL report **E1720** when a registration names a contract that the type does not conform to. The compiler SHALL report **E1721** when a `with` statement does not follow a `launch` in the same function body. Statement level and nested `if`, `while`, `for` and `with` positions SHALL be accepted; other positions, such as match arms, lambdas and methods, SHALL be **E1721**. The checks for E1719 SHALL cover types of the analysed unit; imported types need not be checked.

#### Scenario: Type with a value field
- **GIVEN** `registry { single Greeter; }` where `Greeter` has the field `string name;`
- **WHEN** the host is checked
- **THEN** the compiler SHALL report **E1719**

#### Scenario: With before launch
- **GIVEN** a function body that has `with Request { ... }` before any `launch`
- **WHEN** the function is checked
- **THEN** the compiler SHALL report **E1721**

### Requirement: Registrations of one key and overrides
Several registrations of one key inside one host SHALL all be kept as multiple implementations. A later host in the chain SHALL override a key of a base host. A singular `inject` that matches several registrations SHALL be **E1705**, with a fix that replaces `T name` by `T[] names` (applicability `MaybeIncorrect`). The diagnostic **E1713** SHALL name the contract key (for example `Clock`) and SHALL list the base registration as a related location. Registration keys and inject requests SHALL compare by the last segment of their path.

#### Scenario: Two registrations, singular inject
- **GIVEN** a host with two registrations of `Greeter` and a service with `inject Greeter greeter;`
- **WHEN** the host is checked
- **THEN** the compiler SHALL report **E1705** with a fix to `inject Greeter[] greeters;`

#### Scenario: Lifetime override mismatch
- **GIVEN** a host that overrides the `single` registration of `Clock` with a scoped one
- **WHEN** the host is checked
- **THEN** the compiler SHALL report **E1713** that names `Clock`, with the base registration as a related location

### Requirement: Base hosts from any unit
A base host named in `host Name : Base` SHALL be found in any unit of the assembly, including a library unit and a Corelib unit, by name or by a path that ends in the name. The base registrations SHALL be inherited as for a base host of the same unit.

#### Scenario: Corelib base host
- **GIVEN** `use Console.Hosting;` and `host App() : ConsoleHost { }`
- **WHEN** the host is resolved
- **THEN** the registrations of `ConsoleHost` are part of the container of `App`

### Requirement: Launch and with arguments
The arguments of `launch` SHALL be type-checked against the parameters of the host, and the arguments of `with` against the parameters of the scope, with **E1708** for a mismatch. The host parameters SHALL be visible in the hooks of that host, and the scope parameters SHALL be visible in the hooks of that scope.

#### Scenario: Argument type mismatch
- **GIVEN** `host App(string name)` and `launch App(3)`
- **WHEN** the program is checked
- **THEN** the compiler SHALL report **E1708** at the argument

#### Scenario: Parameter visible in a hook
- **GIVEN** `host App(string name)` with a `startup` hook that reads `name`
- **WHEN** the program is checked and run with `launch App("Ada")`
- **THEN** the hook reads `"Ada"`
