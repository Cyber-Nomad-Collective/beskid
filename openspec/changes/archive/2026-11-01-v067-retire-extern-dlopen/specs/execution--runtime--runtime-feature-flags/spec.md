## ADDED Requirements

### Requirement: Engine has no dynamic extern feature
The crate `beskid_engine` SHALL NOT define a Cargo feature that enables, disables or changes the resolution of extern symbols. Extern resolution SHALL behave in the same way in every build of the engine, as "Extern resolution fails closed" in `execution--abi-and-host--extern-dispatch-and-policy` states. The feature `extern_dlopen` and rule RFF-006 are retired. A build or test command SHALL NOT pass `--features extern_dlopen`.

#### Scenario: No feature to enable
- **GIVEN** the Cargo manifest of `beskid_engine`
- **WHEN** a tool lists its features
- **THEN** the list does not contain `extern_dlopen`

#### Scenario: Extern tests run in the default build
- **GIVEN** the extern tests of `beskid_engine`
- **WHEN** a maintainer runs them with the default features on Linux
- **THEN** they run and do not need a feature flag
