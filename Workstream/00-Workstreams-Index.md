# Workstreams Index (Execution Order)

This index defines the recommended execution order across workstreams and the entry file to start with in each directory. Do not rename directories without coordination; use this index to coordinate parallel work.

1) AOT_Refactor
   - Entry: Workstream/AOT_Refactor/M0-stabilization-baseline.md
   - Focus: Parser/HIR plumbing, semantics parity, events, diagnostics, backend parity.

2) Standard Library
   - Entry: Workstream/Standard Library/Standard-Library-Implementation-Plan.md
   - Focus: Core modules, collections, query contracts/operators, system APIs, release hardening.

3) Package Manager (server)
   - Entry: Workstream/Package Manager/00-Program-Plan.md
   - Focus: Identity/API keys, registry core, web portal, DevOps/security/observability.

4) Package Management client
   - Entry: Workstream/Package Management client/Package-Management-Compiler-and-Site-Plan.md
   - Focus: Compiler-side pckg client (Rust), site integration, publish/install flows.

5) pckg ui
   - Entry: Workstream/pckg ui/fluent-ui-blazor-component-refactor-plan.md
   - Focus: Fluent UI Blazor, UX polish, integration with server endpoints.

6) Compilation
   - Entry: Workstream/Compilation/Compilation-Workstream-Plan.md
   - Focus: End-to-end compiler: frontend/parser+HIR, resolution+typing, control flow/iteration, codegen, extern, runtime integration.

7) Runtime
   - Entry: Workstream/Runtime/Runtime-Workstream-Plan.md
   - Focus: ABI freeze, memory/GC, strings/arrays, events, scheduler/time, FFI/externs, diagnostics, metrics, security, testing/CI, performance.

Notes
- Duplicate directory detected: "Workstream/Package Management client " (trailing space). Treat as deprecated; see the next file in that directory for details. Prefer the space-less directory above.
- Coordination: Runtime has been reorganized into WS1–WS12 workstreams instead of M0–M4. Contributors should pick the next unblocked WS task and reference this index in PR descriptions.
- Cross-stream dependencies: AOT_Refactor unlocks parts of Standard Library; Package Manager unblocks client and UI integrations.

