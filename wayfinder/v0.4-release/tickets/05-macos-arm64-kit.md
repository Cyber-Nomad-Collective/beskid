## Question

Build and verify the macOS arm64 runtime kit (CYB-170) so that the 0.4.0 release includes a verified native kit for Apple Silicon.

The native runtime kit must pass conformance fixtures on macOS arm64. This is independent of ISLE lowering work and can proceed in parallel with other tickets.

## Acceptance

- macOS arm64 kit builds cleanly from the 0.4 compiler
- Passes runtime conformance fixtures (smoke tests, corelib gate)
- Kit artifact is published or documented for the release
