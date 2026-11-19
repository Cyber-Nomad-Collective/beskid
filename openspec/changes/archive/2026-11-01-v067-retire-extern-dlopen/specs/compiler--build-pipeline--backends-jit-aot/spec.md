## ADDED Requirements

### Requirement: JIT and AOT extern resolution
The JIT backend SHALL resolve required extern symbols as "Extern resolution fails closed" in `execution--abi-and-host--extern-dispatch-and-policy` states. The AOT backend SHALL fail with **E4050** (unresolved extern library) before it links when a required extern names a library that is not in the link libraries of the project or in the libraries of the runtime kit. An optional extern SHALL NOT cause E4050. Neither backend SHALL apply an allow list or a deny list from the environment. Neither backend SHALL fall back to the other mode when it fails.

#### Scenario: AOT library not linked
- **GIVEN** a required extern whose library is not in the project link libraries
- **WHEN** the AOT backend builds the artifact
- **THEN** the build fails with **E4050** that names the library and the symbol

#### Scenario: No silent fallback
- **GIVEN** a JIT extern resolution that fails
- **WHEN** the backend reports the failure
- **THEN** it reports a diagnostic and does not try an AOT build
