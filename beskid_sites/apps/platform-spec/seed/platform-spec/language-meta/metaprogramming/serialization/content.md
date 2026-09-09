import SpecPageHeader from '@beskid/beskid-ui/platform-spec/SpecPageHeader.astro';
import SpecSection from '@beskid/beskid-ui/platform-spec/SpecSection.astro';

<SpecPageHeader status="Standard" ownerName="Piotr Mikstacki" ownerEmail="pmikstacki@cybernomad.it" submitterName="Piotr Mikstacki" submitterEmail="pmikstacki@cybernomad.it" />

<SpecSection title="Package split" id="package-split">
Serialization is split across three package roles:

| Package | Role |
| --- | --- |
| **Serialization Mod** (`type: Mod`) | Defines `[Serialize]` via `AttributeGenerator`; implements `Generator` for serializer emission |
| **Serialization** (library) | References Serialization Mod; exposes common metadata APIs for serializable types |
| **Json** (library) | Format-specific read/write primitives consumed by generated serializers |
</SpecSection>

<SpecSection title="Attribute ownership" id="attribute-ownership">
The `[Serialize]` attribute is defined in **Serialization Mod**, not in Compiler Mod SDK core. Host projects depend on Serialization (library), which transitively loads Serialization Mod through the dependency graph.
</SpecSection>

<SpecSection title="Generation model" id="generation-model">
Serialization Mod generators:

1. Collect types annotated with `[Serialize]` through `Collector` contracts.
2. Emit typed AST (for example `extend type` helpers and format adapters) through incremental `Generator` contracts.
3. Never emit formatted source text; output is structural AST only.

Analyzers in Serialization Mod validate serializable shape constraints before lowering.
</SpecSection>
