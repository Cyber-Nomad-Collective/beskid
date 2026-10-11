## ADDED Requirements

### Requirement: Fully qualified module paths
A path that spells a module's full name SHALL resolve without a `use`; `use`
only introduces shorter names. When no import resolves the module part, it
SHALL resolve only if exactly one visible unit declares that module and each
declared parent module exposes the next segment with `pub mod`. Item
visibility rules SHALL still apply to the final segment.

**Stable ID:** `BSP-REQ-NAME-FULLY-QUALIFIED-MODULE-PATH`

#### Scenario: Qualified call without an import
- **GIVEN** a program with no `use Core.Collections.Queue;`
- **WHEN** it calls `Core.Collections.Queue.New<i64>()`
- **THEN** the call resolves to `New` declared in module
  `Core.Collections.Queue`

#### Scenario: Qualified call beside an alias
- **GIVEN** a program that imports `Core.Output` under an alias
- **WHEN** it calls `Core.Output.WriteLine(...)` by its full path
- **THEN** the call resolves to the declared `WriteLine`; the alias only adds
  a shorter spelling

### Requirement: Fully qualified paths stay inside module visibility
A fully qualified path SHALL NOT resolve into a module that its parent
declares without `pub mod`. A path whose module no visible unit declares, or
that more than one visible unit declares, SHALL stay unresolved.

**Stable ID:** `BSP-REQ-NAME-FULLY-QUALIFIED-MODULE-VISIBILITY`

#### Scenario: Private module is unreachable by full path
- **GIVEN** module `Core.Text.Parser` that declares `mod Core.Text.Parser.Private;`
  without `pub`, and `Private` that declares `Hidden()`
- **WHEN** another module calls `Core.Text.Parser.Private.Hidden()`
- **THEN** the path does not resolve

### Requirement: Parameters and locals shadow method-owned fields
Inside a method, a bare name SHALL resolve to a parameter or local of that
name when one is in scope, and SHALL read a field of the implicit receiver
only when no parameter or local binds the name. `this.name` SHALL still read
the field.

**Stable ID:** `BSP-REQ-NAME-LOCALS-SHADOW-FIELDS`

#### Scenario: Parameter shadows a field
- **GIVEN** `type Holder { string text, string Echo(string text) { return text; } }`
- **WHEN** `holder.Echo("arg")` is evaluated on a `Holder` whose field `text`
  is `"field"`
- **THEN** the result is `"arg"`

#### Scenario: Local shadows a field
- **GIVEN** `type Holder { i64 count, i64 Local() { i64 count = 7; return count; } }`
- **WHEN** `Local()` is called on a `Holder` whose field `count` is `1`
- **THEN** the result is `7`
