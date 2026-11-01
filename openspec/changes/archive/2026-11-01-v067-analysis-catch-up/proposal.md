## Why

After an edit burst on a large file, the language server needed 14-41 s to store the facts of the newest text (10 s of edits every 150 ms on a loaded builder: `TraversalManifest.bd` 52 KB, 13.6-18.3 s; `Bsol/Schema.bd` 141 KB, 40.8-41.3 s). During that time rename, prepare rename and code actions failed with `ContentModified`, and the read-only requests answered from carried facts. Three causes:

- Each analysis of an open document judged every own unit of its project: the structural rules of each other unit and the typing and legality obligations of all their items. The server then dropped every finding outside the document. For a file of a large library, this took 11-12 s for each edit.
- A newer text did not stop a running analysis of an older text. The analysis of the newest text started only after it.
- The completion repair changed a complete member access at the end of a line (`Syntax.Span` above the `{` of its struct literal) to `Syntax.Span;`. The repaired text did not parse, and each edit of the file ran three to four parse recoveries of the whole file and a second analysis.

## What Changes

- The analysis of an open document and the publication of its diagnostics judge the unit of that document only. The published diagnostics do not change. The workspace index and `beskid check` judge every own unit.
- A newer text of an open document, or closing the document, stops the running analysis of an older text at its next database query.
- The completion repair changes a member access only when the member is being typed.
- A text that parses is parsed once for all syntax facts of an analysis (documentation, outline, attributes, completion syntax).

## Capabilities

### Modified Capabilities
- `tooling--lsp--diagnostics-and-workspace-analysis`.
- `tooling--lsp--intellisense-capabilities-and-behavior`.

## Impact

`beskid_analysis` (front-end option for the judged units, one grammar pass per successful parse), `beskid_queries` (query gate for the judged units), `beskid_lsp` (cancellation of superseded analyses, editor front end, completion repair, single parse). Target release: 0.6.7.

## Compatibility, Migration and Reversion

No users exist. Published diagnostics do not change. Completion for a member access that ends a line before `{`, `.`, `(` or an operator uses the facts of the text as written.
