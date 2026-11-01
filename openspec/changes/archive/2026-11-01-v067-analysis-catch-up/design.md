# Design: analysis catch-up after an edit burst (0.6.7)

## Judged units

The prepare spine judges the root units of a preparation: the structural rules (`SemanticPipelineRule`) for each own unit, and the query gate (typing, legality, unit obligations) for the items of each own unit and their direct-call closure. `beskid check` needs every own unit, so that an error in a unit that nothing calls is reported. The language server publishes the diagnostics of one buffer per preparation and drops the findings of other units (`entry_buffer_diagnostics`). The diagnostics of those units come from their own preparations (open documents) or from the workspace index (closed files).

`FrontEndOptions::judged_units` selects the judged units: `OwnUnits` (default: `beskid check`, codegen, the workspace index) or `Entry` (the preparation of an open document, for its analysis and its publication). With `Entry`, the spine runs no structural rules for the other units, and the query gate judges the entry unit only. The findings located in the entry unit do not change: the gate judges the items of the entry unit and their call closure in both modes.

## Cancellation

The per-document update gate runs the analyses of one document one after the other. A queued analysis of an older text returns when it starts. A running analysis used to run to its end. Each analysis registers the Salsa cancellation token of its database handle for its document. A newer text (`didChange`, `didOpen`) or `didClose` cancels the registered token, and Salsa unwinds the analysis at its next query. The analysis catches the unwind and stores no facts. When a cancellation arrives after the last query of the work, the server consumes it before the next user of the database handle.

## Completion repair

The repair writes `x;` after `receiver.`, and `;` after `receiver.Member` at the end of a line, so that the parser does not read the next line as the member. A member followed by a new statement, by `}` or by the end of the buffer is being typed. A member followed by other text (`{`, `.`, `(`, `,`, an operator) ends a line of a complete expression, and the server does not repair it.

## Measurement

Probe `probe_catch.py` (slice notes): an idle server on the Corelib soak corpus, 10 s of edits every 150 ms that add a comment line, then a rename every 250 ms until it is not `ContentModified`.

| File | Before | After |
|---|---|---|
| `TraversalManifest.bd` (52 KB) | 13.6 s, 18.3 s | 1.03 s, 1.07 s |
| `Bsol/Schema.bd` (141 KB) | 41.3 s, 40.8 s | 2.38 s, 2.00 s |
