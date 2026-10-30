## 1. Spec
- [x] 1.1 Write the delta.
## 2. Implementation
- [x] 2.1 `FrontEndOptions::judged_units`; the editor judges the entry unit only (structural rules and query gate); the workspace index judges every own unit.
- [x] 2.2 A newer text or `didClose` cancels the running analysis of the document at its next database query.
- [x] 2.3 The completion repair skips a whole member followed by text that is not a new statement, `}` or the end of the buffer.
- [x] 2.4 One grammar pass per successful parse; one parse for the syntax facts of an analysis.
## 3. Verify
- [x] 3.1 Catch-up probe: the newest facts are stored 1.0-2.4 s after a 10 s burst (was 13.6-41.3 s).
- [ ] 3.2 30-minute soak with the lspwait budgets: PASS.
