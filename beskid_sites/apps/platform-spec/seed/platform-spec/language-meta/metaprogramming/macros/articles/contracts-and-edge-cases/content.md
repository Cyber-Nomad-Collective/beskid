import SpecArticleChrome from '@beskid/beskid-ui/platform-spec/SpecArticleChrome.astro';

<SpecArticleChrome />

## Hard requirements

- **Macros before mods** — Expansion runs before mod phases on each syntax generation.
- **Structural expansion only** — No string formatting or source-text emission.
- **Depth cap** — Default 32 per compilation unit.
- **Well-formedness** — Expanded trees must pass structural checks before semantic analysis.

## Diagnostic band E19xx

| Code | Condition |
| --- | --- |
| **E1901** | Unknown macro |
| **E1902** | Macro argument arity mismatch |
| **E1903** | Macro argument kind mismatch |
| **E1904** | Macro metavariable outside body |
| **E1905** | Macro expansion depth exceeded |
| **E1907** | Ambiguous macro name |
| **E1908** | Duplicate macro parameter |

## Edge cases

- **Metavariable outside macro** — `$name` outside a macro body emits **E1904**.
- **Empty macro body** — A macro with an empty body expands to nothing (valid but usually pointless).
- **Macro in macro** — A macro invocation inside another macro body is expanded in the next iteration.
- **Item-position macros** — When a parameter is `item`, the invocation may appear at module item position.

## Invariants

- Expanded trees must have fresh node identities; diagnostic spans trace to expansion sites.
- Mod-emitted code containing macro invocations is expanded after re-parse.
- Language macros do not register in `mod.descriptor.json`.
