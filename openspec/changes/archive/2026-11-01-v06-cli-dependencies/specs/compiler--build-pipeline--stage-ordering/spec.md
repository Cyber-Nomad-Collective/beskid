## ADDED Requirements

### Requirement: Bounded atomic compiler snapshot restoration

Compiler snapshot restoration SHALL bound the entire input before recursive deserialization to at most 64 MiB, JSON container depth 256, two million containers, and 4 MiB per encoded JSON string. It SHALL check bytes outside strings iteratively and SHALL retain a bounded stack for deserialization and disposal of a partially restored candidate. A valid compiler-produced snapshot deeper than the JSON library default recursion limit SHALL restore when it satisfies these limits. Turning off library recursion protection without equivalent explicit limits and stack protection SHALL NOT be accepted.

Restoration SHALL validate exact compiler identity, snapshot schema version, payload digest and Salsa ingredient allocation ordering before publishing any restored state. Deserialization SHALL operate on a disposable candidate, and all rejected inputs SHALL leave the caller's live database and registries usable. Snapshot production SHALL apply the same size and structural limits before replacing an existing on-disk snapshot.

#### Scenario: Real deep syntax snapshot restores

- **GIVEN** a snapshot containing real persisted syntax and query memos with JSON container depth above 128 and within 256
- **WHEN** the exact compiler reloads the unmodified snapshot
- **THEN** restoration succeeds, file and syntax registries are restored, and the same syntax query result remains available

#### Scenario: Oversized or overdeep snapshot fails before mutation

- **GIVEN** an input exceeding the byte, depth, container or string limit and an existing live database
- **WHEN** restoration is attempted
- **THEN** it rejects the snapshot without publishing candidate state and the existing database remains usable

#### Scenario: Deep malformed candidate is discarded safely

- **GIVEN** bounded nested snapshot data with valid identity and digest but invalid persisted query data
- **WHEN** candidate deserialization rejects it
- **THEN** candidate cleanup occurs with stack protection and the caller's existing file and query state remains unchanged

#### Scenario: Invalid replacement snapshot preserves prior snapshot

- **GIVEN** an existing on-disk snapshot and a candidate serialization exceeding the structural limits
- **WHEN** snapshot save is attempted
- **THEN** save reports the limit failure before switching the snapshot and retains the previous file
