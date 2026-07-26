## ADDED Requirements

### Requirement: Canonical ABI-v5 synchronization runtime implementation
The channel, hub, mutex, and wait-group ABI surfaces SHALL be implemented by
the canonical Beskid runtime corpus and exported only through the
manifest-derived ABI-v5 runtime kit. Their observable contracts remain those
defined by this capability; implementation and test anchors SHALL NOT require
the Rust `beskid_runtime` crate.

#### Scenario: Synchronization builtin provenance
- **GIVEN** an exact ABI-v5 runtime kit
- **WHEN** a conformance test resolves a synchronization builtin
- **THEN** the artifact verifier finds canonical runtime and approved assembly
  provenance only, with no Rust runtime archive or bridge fallback

