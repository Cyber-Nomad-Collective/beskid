## ADDED Requirements

### Requirement: Host hook order
The runtime SHALL run host hooks in this order. At `launch`, the global-scope `init` hooks SHALL run first, and then the `startup` hooks, after the container has started. When a `with` block enters a named scope, the `init` hooks of that scope SHALL run after the scope is entered. When a `with` block exits by any path, including normal end, `return`, `break` and `continue`, the `dispose` hooks of that scope SHALL run before the scope is left; they SHALL run only for an activation whose `init` completed. When the launch lifetime ends, the global `dispose` hooks SHALL run before the container shuts down. In a host chain, `init` and `startup` hooks SHALL run base host first, and `dispose` hooks SHALL run the launched host first and the base host last. Within one host, `dispose` hooks SHALL run in the reverse of their declaration order. A `startup` hook declared inside a named scope SHALL be **E1717**.

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
A registered service SHALL have only `inject` fields, because the container creates it without a constructor. The compiler SHALL report **E1718** when a contract is registered as itself, with a fix. The compiler SHALL report **E1719** when a registered type is one that the container cannot create: a type with a value field, a generic type, or an enum. The compiler SHALL report **E1720** when a registration names a contract that the type does not conform to. The compiler SHALL report **E1721** when a `with` statement does not follow a `launch` in the same function body. Statement level and nested `if`, `while`, `for` and `with` positions SHALL be accepted; other positions, such as match arms, lambdas and methods, SHALL be **E1721**. The checks SHALL cover every registration of the host chain, including registrations of base hosts in other units. An error in another unit SHALL be reported at the position in that unit.

#### Scenario: Type with a value field
- **GIVEN** `registry { single Greeter; }` where `Greeter` has the field `string name;`
- **WHEN** the host is checked
- **THEN** the compiler SHALL report **E1719**

#### Scenario: With before launch
- **GIVEN** a function body that has `with Request { ... }` before any `launch`
- **WHEN** the function is checked
- **THEN** the compiler SHALL report **E1721**

### Requirement: Registrations of one key and overrides
Several registrations of one key inside one host SHALL all be kept as multiple implementations. A later host in the chain SHALL override a key of a base host. A singular `inject` that matches several registrations SHALL be **E1705**, with a fix that replaces `T name` by `T[] names` (applicability `MaybeIncorrect`). The diagnostic **E1713** SHALL name the contract key (for example `Clock`) and SHALL list the base registration as a related location. Registration keys and inject requests SHALL compare by full declaration identity, not by the last segment of a path. Two types with the same simple name in different modules SHALL be different keys.

#### Scenario: Two registrations, singular inject
- **GIVEN** a host with two registrations of `Greeter` and a service with `inject Greeter greeter;`
- **WHEN** the host is checked
- **THEN** the compiler SHALL report **E1705** with a fix to `inject Greeter[] greeters;`

#### Scenario: Same simple name in two modules
- **GIVEN** `A.Clock` and `B.Clock` and a registration of `A.Clock`
- **WHEN** a service declares `inject B.Clock clock;`
- **THEN** the compiler SHALL report **E1704** because `B.Clock` is not registered

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
The arguments of `launch` SHALL be checked against the parameters of the host, and the arguments of `with` against the parameters of the scope. A wrong argument type SHALL be the ordinary type-mismatch error at the argument. A wrong argument count SHALL be **E1722** for `launch` and **E1708** for `with`. Only the launched host SHALL declare parameters. Parameters on a base host, or on a scope of a base host, SHALL be **E1723**. A launched host from another unit SHALL NOT take `launch` arguments; passing them SHALL be **E1722**. The host parameters SHALL be visible in the `startup` hook and in the global `init` and `dispose` hooks of that host. The scope parameters SHALL be visible only in the hooks of that scope.

#### Scenario: Argument type mismatch
- **GIVEN** `host App(string name)` and `launch App(3)`
- **WHEN** the program is checked
- **THEN** the compiler SHALL report the type-mismatch error at `3`

#### Scenario: Argument count
- **GIVEN** `host App(string name)` and `launch App()`
- **WHEN** the program is checked
- **THEN** the compiler SHALL report **E1722**

#### Scenario: With argument count
- **GIVEN** `scope Request(i64 id)` and `with Request { }`
- **WHEN** the program is checked
- **THEN** the compiler SHALL report **E1708**

#### Scenario: Parameters on a base host
- **GIVEN** a base host `host Base(string name)` that another host extends and launches
- **WHEN** the program is checked
- **THEN** the compiler SHALL report **E1723** at the parameter list of `Base`

#### Scenario: Parameter visible in a hook
- **GIVEN** `host App(string name)` with a `startup` hook that reads `name`
- **WHEN** the program is checked and run with `launch App("Ada")`
- **THEN** the hook reads `"Ada"`

### Requirement: Duplicate registration
Registering the same implementation for the same key twice in one host and scope SHALL be **E1724** at the second registration, with the first registration as a related location.

#### Scenario: Same registration twice
- **GIVEN** a host that contains `single Hello for Greeter;` twice
- **WHEN** the host is checked
- **THEN** the compiler SHALL report **E1724** at the second line with the first line as a related location

### Requirement: Lifetimes per activation
A `single` registration declared inside a scope SHALL have one instance per activation of that scope. A host-level `single` SHALL have one instance per container. A `scoped` registration SHALL have one instance per activation of its scope. Each `with` SHALL create fresh `scoped` instances and fresh scope-declared `single` instances before the `init` hooks of the scope run, in dependency order, and SHALL release them after the `dispose` hooks have run. A nested `with` SHALL get its own set. Repeated `with` blocks of one scope SHALL be independent activations with separate instance sets.

#### Scenario: Two activations of one scope
- **GIVEN** a scope `Request` with a `scoped` service and two `with Request` blocks
- **WHEN** both blocks run in one launch
- **THEN** each block sees its own instance of the service

#### Scenario: Scope-declared single
- **GIVEN** a `single` declared inside the scope `Request` and a host-level `single`
- **WHEN** two `with Request` blocks run
- **THEN** each block sees its own instance of the scope-declared `single`, and both see the same host-level instance

### Requirement: Captive dependency
A host-level `single` that injects a per-activation service SHALL be **E1725** at the inject site. The rule SHALL hold when the injection reaches the per-activation service directly or through a `transient`. The related location SHALL be the registration of the per-activation service.

#### Scenario: Single injects scoped
- **GIVEN** a host-level `single Cache` with `inject Session session;` where `Session` is `scoped` in `Request`
- **WHEN** the host is checked
- **THEN** the compiler SHALL report **E1725** at `inject Session session;`

#### Scenario: Single injects scoped through a transient
- **GIVEN** a host-level `single Cache` that injects a `transient Helper` that injects the `scoped Session`
- **WHEN** the host is checked
- **THEN** the compiler SHALL report **E1725**
