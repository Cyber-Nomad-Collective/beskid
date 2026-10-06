## Why

Real native Generator RED proved production dispatch ignored the exported entrypoint. Required serialization cannot emit typed adapters through a stub, parsed source strings or unvalidated AST addresses. A generation-owned arena and a distinct versioned native constructor request are prerequisites.

## What Changes

- Introduce an explicit structural-generator ABI v1 request/table, separate from the unchanged legacy ModGenerationRequest ABI.
- Require artifact ABI discriminator, real native calls, bounded static constructors, validated owner/generation/kind/lifetime and preserved provenance.
- Carry actual assembly generation into Mod context and pipeline operations; expose a read-only versioned semantic handle for generation-bound shape facts.
- Remove native Generator stub success; unavailable required constructor/query capabilities fail closed.

## Capabilities

### Modified Capabilities
- `compiler--compiler-mods--typed-emitter-and-transforms`: native structural constructor request and arena contract supporting v06-serialization-bsol.
- `compiler--compiler-mods--mod-host-bridge`: strict artifact ABI negotiation and actual-generation handoff.

## Impact

Normal canonical AOT/ISLE remains unchanged. Mod user ABI is distinct from runtime ABI-v5; no runtime-state field is repurposed. Required structural artifacts declare their ABI explicitly; old Generator signatures are never guessed or silently used as substitutes. Public routes remain /docs/standard/ and existing redirects remain intact.

## Compatibility, Migration and Reversion

Migrate generators to explicit structural request/table and remove required native stub fallback. Legacy ModGenerationRequest remains a separate declared ABI, not a silently extended layout. Unsupported required capabilities reject before generation. Rollback disables structural capability and rejects its artifacts; it cannot reinterpret v1 requests as legacy or claim full serialization delivered.
