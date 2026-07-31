## Question

Build and verify the Windows x86-64 runtime kit (CYB-171) so that the 0.4.0 release includes a verified native kit for Windows.

The native runtime kit must pass conformance fixtures on Windows x86-64. This is independent of ISLE lowering work and can proceed in parallel with other tickets.

## Acceptance

- Windows x86-64 kit builds cleanly from the 0.4 compiler
- Passes runtime conformance fixtures (smoke tests, corelib gate)
- Kit artifact is published or documented for the release
