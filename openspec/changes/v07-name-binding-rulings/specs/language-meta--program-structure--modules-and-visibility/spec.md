## MODIFIED Requirements

### Requirement: Pub use re-exports
`pub use path;` SHALL be a public re-export edge from the containing module to the module or item that `path` names. A plain `use` SHALL NOT re-export. Re-exported names SHALL refer to accessible items. A `pub use` that names an item that is not `pub`, or a module that the containing module cannot reach, SHALL fail with **E1501**, whichever source unit declares the item. An importer of a hub module SHALL reach the items of the hub's public re-export edges and public child modules breadth-first: the hub's own `pub` items SHALL shadow re-exported ones; a nearer item SHALL shadow a farther one; two distinct items at one distance SHALL be ambiguous (no binding for an unqualified import, **E1104** for `Hub.Item`). Only items that a child module declares SHALL be re-exported, not items it imports. An item that the importer imports directly SHALL take precedence over a re-exported item of the same name.

#### Scenario: Re-export of inaccessible item
- **GIVEN** a `pub use` that names a private item from another module
- **WHEN** re-export checking runs
- **THEN** the re-export is rejected with **E1501**

#### Scenario: Re-export of a private item of the same unit
- **GIVEN** a unit that declares `unit Normalize()` without `pub` and `pub use Codec.Normalize;` where `Codec` is that unit's module
- **WHEN** re-export checking runs
- **THEN** the compiler emits **E1501**

#### Scenario: Importer reaches a re-exported item
- **GIVEN** a hub module `Net` with `pub use Net.Http.Client;`, where `Net.Http.Client` declares `pub type Client`
- **WHEN** a unit with `use Net;` names the type `Client`
- **THEN** the type binds to `Net.Http.Client.Client`

#### Scenario: Two items at one distance
- **GIVEN** a hub module with two public child modules that both declare `pub type Frame`
- **WHEN** a unit names `Hub.Frame`
- **THEN** the compiler emits **E1104**

## ADDED Requirements

### Requirement: Source unit privacy boundary
An item, member or field without `pub` SHALL be private to the source unit that declares it. Code in that source unit SHALL access it; code in any other source unit SHALL NOT, and the compiler SHALL report **E1107** for an item or method and **E1211** for a field. A source unit and its generated companion (`X.g.bd`) SHALL count as one source unit for this rule, so they share their private items. No module, including the root module, SHALL be exempt. An inline module SHALL NOT be a privacy boundary: a private item of an inline module SHALL be accessible in the whole source unit. A member item SHALL NOT inherit the visibility of its parent type: a method or field without `pub` SHALL be private even when its type is `pub`.

#### Scenario: Private function of another unit
- **GIVEN** `Shapes.bd` that declares `unit Helper() {}` without `pub`
- **WHEN** `Main.bd` calls `Shapes.Helper()`
- **THEN** the compiler emits **E1107**

#### Scenario: Generated companion reads a private item
- **GIVEN** `Shapes.bd` that declares `unit Helper() {}` without `pub` and its companion `Shapes.g.bd` that calls `Helper()`
- **WHEN** the package is checked
- **THEN** the call binds to `Helper` without a diagnostic

#### Scenario: Private item of an inline module in the same unit
- **GIVEN** one source unit with `mod inner { unit Hidden() {} }` and a top-level function that calls `inner.Hidden()`
- **WHEN** the unit is checked
- **THEN** the call binds to `Hidden` without a diagnostic

#### Scenario: Member of a public type is private by default
- **GIVEN** `Panel.bd` that declares `pub type Panel { unit Layout() {} }`
- **WHEN** another unit calls `panel.Layout()` on a `Panel` local
- **THEN** the compiler emits **E1107** for `Layout`

### Requirement: Private child modules
A module declared by a `mod` declaration without `pub` SHALL be reachable by path only from source units inside the subtree of its parent module. A reference from outside that subtree SHALL fail with **E1107**.

#### Scenario: Private child module from outside
- **GIVEN** `Net.bd` with `mod Net.Internal;`, and `Net.Internal` declares `pub unit Reset()`
- **WHEN** `App.bd` calls `Net.Internal.Reset()`
- **THEN** the compiler emits **E1107**
