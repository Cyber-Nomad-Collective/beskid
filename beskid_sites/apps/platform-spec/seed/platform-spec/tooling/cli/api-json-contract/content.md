import SpecPageHeader from '@beskid/beskid-ui/platform-spec/SpecPageHeader.astro';
import SpecSection from '@beskid/beskid-ui/platform-spec/SpecSection.astro';
import DomainTiles from '@beskid/beskid-ui/platform-spec/DomainTiles.astro';

<SpecPageHeader ownerName="Piotr Mikstacki" ownerEmail="pmikstacki@cybernomad.it" submitterName="Piotr Mikstacki" submitterEmail="pmikstacki@cybernomad.it" />

<SpecSection title="What this feature specifies" id="what-this-feature-specifies">

`api.json` is the **primary structured contract** for registry API documentation. The Beskid CLI emits it under `.beskid/docs/` during `beskid doc` and `beskid pckg pack` for **`packageKind: library`** artifacts. Consumers (pckg, IDE tooling, custom renderers) **must** treat the JSON graph as authoritative for navigation, member hierarchy, and type linking—not parallel ad-hoc grouping outside the schema.

**`packageKind: template`** packages **must not** require or display `api.json` on the registry. See **[Template packages](/platform-spec/tooling/project-scaffolding/template-packages/)** and **[Package kinds](/platform-spec/tooling/registry-client/package-kinds/)**.

</SpecSection>

<SpecSection title="Implementation anchors" id="implementation-anchors">

- Schema emission: `compiler/crates/beskid_analysis/src/doc/` (`api.json` snapshot and signatures)
- CLI: `compiler/crates/beskid_cli/src/commands/doc.rs`
- Registry ingestion: `compiler/crates/beskid_pckg/src/api_doc.rs` and pckg `StructuredApiDocDtos`
- UI: pckg `PackageDocs` components driven by deserialized `api.json`

</SpecSection>

<SpecSection title="Articles" id="articles">

<SpecSection title="Decisions" id="decisions">
No open decisions. **`D-TOOL-CLI-0001`** (`api.json` primary contract), **`0002`** (hub authority), **`0003`** (`symbolKey` stable identity)—see **`adr/`** and the **ADRs** tab.
</SpecSection>



</SpecSection>
