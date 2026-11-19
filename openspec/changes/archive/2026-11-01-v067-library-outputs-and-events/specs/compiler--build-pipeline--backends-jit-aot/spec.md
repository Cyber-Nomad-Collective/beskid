## ADDED Requirements

### Requirement: Library output item selection
A library output (shared, static or object) SHALL contain every executable item of the units that the library owns, and the items of dependencies that those items reach, with one exception. An owned item SHALL NOT be in the output when the item or an item that it reaches calls a compiler SDK host callback (`__mod_semantic_*`, `__mod_query_*`) or a `Core.Args` service (`__args_*`), and the item is not an `[Export]` item. A host callback runs only inside a prepared native Mod invocation, and `Core.Args` reads the arguments that only an executable entry captures. A native Mod or an application that compiles the library from source keeps these items. An `[Export]` item that reaches a host callback or `Core.Args` SHALL fail the build. The build SHALL NOT report an internal compiler error for these items.

#### Scenario: Compiler SDK package builds as a library
- **GIVEN** the Corelib compiler SDK package, whose functions wrap host callbacks
- **WHEN** `beskid build` runs in the package directory
- **THEN** the build succeeds and the library output does not contain the callback wrappers

#### Scenario: Library that reads arguments
- **GIVEN** a library whose own function `pub string[] Arguments() { return Args.All(); }` has no `[Export]` attribute
- **WHEN** the library is built
- **THEN** the build succeeds and the library output does not contain `Arguments`

#### Scenario: Exported item that reads arguments
- **GIVEN** a library function with `[Export(Abi:"C", Symbol:"argument_count")]` that returns `Args.Count()`
- **WHEN** the library is built
- **THEN** the build fails with `Core.Args requires executable arguments`
