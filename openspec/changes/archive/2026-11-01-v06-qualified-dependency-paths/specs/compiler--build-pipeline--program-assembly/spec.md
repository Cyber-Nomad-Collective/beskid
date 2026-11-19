## ADDED Requirements

### Requirement: Import-closure discovery fails closed on ambiguous module paths
Import-closure discovery SHALL resolve each module path that it follows (a `use` path, its parent module path, a prefix of a qualified reference and a `mod` declaration path) against every effective source root of the closure: the host source root and each dependency source root. Inside one source root, the first existing candidate file SHALL provide the path, in this order: the flat file, the homonymous file, `mod.bd` and the generated file. When source roots of more than one package provide the path, program assembly SHALL fail with the E1104 module path ambiguity error. The error SHALL name the path and each provider package and file in effective root order. Program assembly SHALL NOT continue with the first provider. Source roots that reach the same canonical file SHALL count as one provider.

#### Scenario: Assembly stops on an ambiguous use path
- **GIVEN** a Lib target with an entry file that contains `use Shared.Codec;` and dependencies `alpha` and `beta` that both provide `Shared.Codec`
- **WHEN** program assembly runs with import-closure discovery
- **THEN** assembly fails with the E1104 module path ambiguity error for `Shared::Codec`
- **AND** the error lists `alpha` before `beta`

#### Scenario: A path with one provider still assembles
- **GIVEN** the same dependencies and an entry file that contains only `use Alpha.Only;`, a path that only `alpha` provides
- **WHEN** program assembly runs with import-closure discovery
- **THEN** assembly succeeds and contains the `Alpha/Only.bd` unit and no `Shared.Codec` unit
