## ADDED Requirements

### Requirement: Default field privacy
A struct field without `pub` SHALL be private to the module that declares its type. The module of a field SHALL be the logical module of the source unit that declares the type, so the declaring source unit SHALL be the privacy boundary. Code in the declaring source unit, including the inline methods of the type, SHALL read the field and SHALL supply it in a struct literal. Code in any other source unit SHALL NOT read the field, SHALL NOT project through it in a field chain, and SHALL NOT supply it in a struct literal; the compiler SHALL report **E1211** "inaccessible struct field" with help that tells the author to mark the field `pub` in its declaring type. A struct literal in another source unit SHALL NOT build a type that has a private value field, also when the literal omits that field. A field marked `pub` SHALL be readable and constructible from every source unit that can name its type. `extend type` bodies SHALL keep **E1511** for private fields of the extended type. The only cross-unit exceptions SHALL be exact compiler-owned admissions that the compiler proves from attested source identity of both units, never from a type or field name alone.

#### Scenario: Private field read from another source unit
- **GIVEN** `Shapes/Request.bd` declares `pub type Request { i64 token }` and `Main.bd` reads `request.token`
- **WHEN** the compiler checks `Main.bd`
- **THEN** it reports **E1211** "inaccessible struct field `token`"
- **AND** the help tells the author to mark the field `pub` in its declaring type

#### Scenario: Projection chain through a private field
- **GIVEN** `Shapes/Request.bd` declares `pub type Inner { i64 secret }` and `pub type Request { pub Inner inner }`, and `Main.bd` reads `request.inner.secret`
- **WHEN** the compiler checks `Main.bd`
- **THEN** it reports **E1211** for `secret`

#### Scenario: Struct literal with a private field from another source unit
- **GIVEN** `Shapes/Request.bd` declares `pub type Inner { i64 secret, pub i64 shared }` and `Main.bd` builds `Inner { secret: 1, shared: 2 }`
- **WHEN** the compiler checks `Main.bd`
- **THEN** it reports **E1211** for `secret` and does not lower the literal

#### Scenario: Private field in the declaring source unit
- **GIVEN** one source file declares `pub type Local { i64 hidden }` and reads and builds `Local` values in the same file
- **WHEN** the compiler checks that file
- **THEN** it accepts every read and literal of `hidden`

#### Scenario: Public field from another source unit
- **GIVEN** `Shapes/Request.bd` declares `pub type Request { pub Inner inner }` and `Main.bd` reads `request.inner`
- **WHEN** the compiler checks `Main.bd`
- **THEN** it accepts the read

#### Scenario: Compiler SDK fields are public to Mods
- **GIVEN** a Mod `Generator` that reads `request.targets.targetIds` from a `Beskid.Compiler.GenerationRequest`
- **WHEN** the compiler checks the Mod package
- **THEN** it accepts the read because the SDK declares `targets` and `targetIds` as `pub`

#### Scenario: A same-named type gets no compiler-owned exception
- **GIVEN** a user source file `Core/Time/Deadline.bd` declares `pub type Deadline { i64 monotonicNanos }` and another user source reads `deadline.monotonicNanos`
- **WHEN** the compiler checks the reading source
- **THEN** it reports **E1211**, because the exception applies only to the attested Corelib units
