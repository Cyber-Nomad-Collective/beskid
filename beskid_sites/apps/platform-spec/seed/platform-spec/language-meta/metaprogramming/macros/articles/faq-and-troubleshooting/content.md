import SpecArticleChrome from '@beskid/beskid-ui/platform-spec/SpecArticleChrome.astro';

<SpecArticleChrome />

## FAQ

### Can macros generate source text?

No. Expansion is structural AST substitution only. No string formatting or source-text emission.

### Can macros execute Beskid code at compile time?

No. Macro bodies are templates, not interpreted functions.

### What is the difference between language macros and Mod SDK?

Language macros are expanded by the compiler intrinsic. Mod SDK generators are AOT-compiled artifacts that emit typed AST. They are separate mechanisms.

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| **E1901** | Macro name not found |
| **E1902** | Wrong number of arguments |
| **E1903** | Argument shape does not match fragment kind |
| **E1904** | `$name` used outside a macro body |
| **E1905** | Expansion too deep (possible infinite recursion) |
| **E1907** | Two macros with the same name |
