import SpecArticleChrome from '@beskid/beskid-ui/platform-spec/SpecArticleChrome.astro';

<SpecArticleChrome />

## Verification matrix

| Scenario | Expected evidence |
| --- | --- |
| Mod package compilation | AOT artifact produced |
| Descriptor generation | `mod.descriptor.json` valid |
| Contract discovery | Host reads descriptor and schedules mods |
| Collector execution | Targets narrowed correctly |
| Generator execution | Typed AST contributions merged |
| Analyzer execution | Diagnostics emitted on merged code |
| Rewrite application | Valid typed replacements applied |

## Implementation checklist

- [x] Contract definitions: `Collector`, `Generator`, `Analyzer`, `Rewriter`, `AttributeGenerator`
- [x] Mod host: load, discovery, scheduling
- [x] AOT artifact contract
- [x] Descriptor format
- [x] Diagnostics: **E1829**, **E1851–E1870**, **E1880–E1884**
- [ ] Full generator round limiting
- [ ] Query pipeline conflict resolution
- [ ] Incremental mod re-execution

## Test locations

- `compiler/crates/beskid_analysis/src/mod_host/` — mod host tests
- `compiler/crates/beskid_tests` — integration tests for mods
