import SpecArticleChrome from '@beskid/beskid-ui/platform-spec/SpecArticleChrome.astro';

<SpecArticleChrome />

## Module layout

| Symbol | Role |
| --- | --- |
| `Core.Text.Regex` | Public API hub (`Match`, `Find`, `FindAll`) |
| `Core.Text.Regex.Generated` | Checked-in combinator parsers from `regex.pest` |
| `grammars/regex.pest` | Canonical bounded pattern language (REGEX-001) |

## Pattern language (bounded v1)

| Construct | Example | Notes |
| --- | --- | --- |
| Literal | `abc` | Concatenated code units |
| Class | `[a-z]`, `[^0-9]` | Inclusive or negated ranges and singletons |
| Quantifier | `*`, `+`, `?` | Greedy; zero-width repeats error (PARSER-003) |
| Grouping | `(foo\|bar)` | Alternation inside group |
| Alternation | `a\|b` | Left-to-right first match |
| Anchors | `^`, `$` | Start/end of subject |
| Escapes | `\d`, `\w`, `\s`, and negated variants | Uses generated text-atom parsers |
| Dot | `.` | Any code unit via `Parse_any_unit` |
