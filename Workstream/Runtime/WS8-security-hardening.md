# WS8: Security Hardening

Owner: Runtime + Engine
Status: Planned

## Scope
- Strengthen extern call controls; add sanitizer-friendly builds
- Guard against accidental symbol surface changes and unsafe patterns

## Deliverables
- Security section in extern-policy; allow/deny patterns and examples (done)
- Sanitizer CI job (ASan/UBSan) for runtime unit tests (Linux)

## Tasks
1. Extern controls
   - Finalize allow/deny env parsing and precedence (done)
   - Integration tests covering allow-only, deny-only, combined
2. Sanitizers
   - Add cargo profiles and CI job to run with ASan/UBSan
   - Fix findings or document justified exceptions
3. Safe defaults
   - Consider zeroing freed memory in debug builds
   - Audit unsafe blocks; minimize scope

## Acceptance Criteria
- CI: sanitizer job green; extern controls thoroughly tested
- Security guidance documented

## Risks/Mitigations
- Sanitizers can be flaky cross-platform; keep Linux-only and fast scope

## References
- compiler/crates/beskid_engine/src/engine.rs (security patterns)
- compiler/docs/extern-policy-v0-1.md

