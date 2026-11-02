## Why

The 30-minute stability-proof soak of 0.6.7-preview.13 measured code actions at p95 500 ms and up to about 700 ms, and diagnostics of an edited document 1.5-2.3 s after the last edit. Three causes:

- A code action waited up to 500 ms for the analysis of the newest text, although its actions need only that text (the fixes of the request's diagnostics, formatting, the documentation comment). About one code action in twenty used the whole budget. Each request also formatted the whole document again (up to 824 ms for a 68 KB file).
- When the stored facts had no documentation facts (a document served from the workspace index, or a text that does not parse), the documentation action parsed the text with a parse recovery on the request's thread: 5.9 s of CPU for a 141 KB Corelib file with a syntax error, which went on after the request had answered at its budget. The recovery memo was keyed by the file name too, so the analysis (which names a buffer by its URI) and the assembly (which names it by its path) recovered the same text twice, and a recovery of a superseded text ran to its end.
- After the analysis of an edit stored its facts, the server waited 120 ms and then prepared the document again in an isolated database, typing the whole assembly, before it published the document's diagnostics. The analysis had computed the same diagnostics already.

## What Changes

- A code action is computed from the newest open text at once, without waiting for its analysis or for the server state. Only a request with a Mod diagnostic in its context (the Mod quick fix comes from the analysis) waits for the facts of the newest text as before. An edit during the computation still gives `ContentModified`.
- The formatting of a text is remembered for the last eight texts and shared by code actions and formatting requests. The documentation action uses the stored documentation facts of exactly that text, else facts from a parse without recovery (remembered per text); a text that does not parse gets no documentation action from a request.
- A parse recovery is remembered per text, whatever the name. A newer text of an open document stops the recovery of the analysis of the older text before its next candidate parse; a stopped recovery is not remembered.
- The diagnostics of an edited open document are published as soon as its analysis stores its facts, when that analysis prepared the project and no file changed on disk and no compilation context was invalidated meanwhile. After such an edit the debounced full preparation of the document does not run when no other open text changed during the analysis either; otherwise (and after an open or a save) it runs and publishes only when its diagnostics differ. A 10-minute soak classified the 259 cases where the full preparation published other diagnostics than the analysis of the same version: 256 were project preparation failures caused by another broken file (the two passes named the failing file differently, or another file changed in between) and 3 were a `Project.lock` changed on disk; none was an analysis that prepared its project with unchanged inputs.
- Code actions no longer wait for the handlers of earlier text-sync notifications of their document (up to 250 ms under load).

## Capabilities

### Modified Capabilities
- `tooling--lsp--intellisense-capabilities-and-behavior`.
- `tooling--lsp--diagnostics-and-workspace-analysis`.

## Impact

`beskid_analysis` (recovery memo key, recovery cancellation), `beskid_lsp` (code actions from the newest text, text memos for formatting and documentation facts, publication from the analysis). Target release: 0.6.7.

## Compatibility, Migration and Reversion

No users exist. Code actions keep their titles, order and edits. A document's diagnostics are the same; they arrive earlier.
