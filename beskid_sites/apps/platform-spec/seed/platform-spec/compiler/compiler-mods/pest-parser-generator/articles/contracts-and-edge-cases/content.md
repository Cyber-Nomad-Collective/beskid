import SpecArticleChrome from '@beskid/beskid-ui/platform-spec/SpecArticleChrome.astro';

<SpecArticleChrome />


## Normative requirements

| ID | Requirement |
| --- | --- |
| **GRAM-001** | Output **must** use `Core.Text.Parser` combinators only. |
| **GRAM-002** | Generated modules **must** land under `.beskid/obj/mods/<id>/generated/`. |
| **GRAM-003** | Host `beskid.pest` **must not** be modified by mod grammars. |
| **GRAM-004** | Unsupported Pest constructs **must** emit **E18xx** with actionable messages. |
| **GRAM-005** | Canonical grammars `regex.pest` and `console_markup.pest` **must** ship with corelib/console packages. |
