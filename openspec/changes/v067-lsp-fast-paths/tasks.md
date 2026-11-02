## 1. Spec
- [x] 1.1 Write the delta.
## 2. Implementation
- [x] 2.1 Code actions from the newest open text; Mod quick fixes wait for the facts of the newest text.
- [x] 2.2 Remembered formatting and documentation facts per text; no parse recovery in a code action.
- [x] 2.3 Recovery memo per text; a newer text stops the recovery of the older text's analysis.
- [x] 2.4 Publish the diagnostics of an edit from its analysis when it prepared its project and no file or context changed; skip the full preparation after an edit when no input changed; fall back to it otherwise.
- [x] 2.5 Code actions skip the text-sync fence.
## 3. Verify
- [x] 3.1 Crate tests: `beskid_analysis` parse 82/0, `beskid_lsp` 233/0 (the edit-publication test fails without the skip), `beskid_queries` 811/0; clippy clean of new warnings; fmt clean (compiler 68e4ace16).
- [x] 3.2 Probe against preview.13 (load 19-28): diagnostics 1.10-1.20 s after the last edit (was 3.36-4.18 s); code action after a burst 80 ms (was `ContentModified` at 603-1125 ms).
- [x] 3.3 30-minute soak: PASS; codeAction p95 266 ms, max 841 ms (650 ms of it before the handler started, server-wide); no publication corrected an analysis.
