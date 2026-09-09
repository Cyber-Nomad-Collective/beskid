import SpecPageHeader from '@beskid/beskid-ui/platform-spec/SpecPageHeader.astro';
import DomainTiles from '@beskid/beskid-ui/platform-spec/DomainTiles.astro';
import SpecSection from '@beskid/beskid-ui/platform-spec/SpecSection.astro';

<SpecPageHeader status="Standard" ownerName="Piotr Mikstacki" ownerEmail="pmikstacki@cybernomad.it" submitterName="Piotr Mikstacki" submitterEmail="pmikstacki@cybernomad.it" />

<SpecSection title="Contract statement" id="contract-statement">
Projects with `type = Mod` **may** register a **`GrammarGenerator`** contract. At `beskid mod rebuild`, the host schedules **`corelib_pest_gen`** (or another grammar mod), which uses **`Core.Text.Pest`** to read `grammars/**/*.pest` and emit Beskid combinator parsers via [Core.Text.Parser](/platform-spec/core-library/text-and-parsing/text-parser-combinators/) (**PARSER-005** naming). Legacy Rust **`beskid_pest_gen`** remains a temporary golden bridge until Beskid emit is AOT-ready. Embedded grammars **must not** modify host [`beskid.pest`](/platform-spec/compiler/front-end/parser-and-ast-contracts/) (see ADR carve-out).
</SpecSection>

<SpecSection title="Implementation anchors" id="implementation-anchors">
- `compiler/corelib/mods/corelib_pest_gen/`
- `compiler/corelib/packages/foundation/src/Core/Text/Pest/`
- `compiler/crates/beskid_pest_gen/` (temporary bridge; retire per design model)
- `compiler/crates/beskid_tests/fixtures/mods/pest_gen_mod/`
</SpecSection>
