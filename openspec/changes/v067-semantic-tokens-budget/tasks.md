## 1. Spec
- [x] 1.1 Write the delta.
## 2. Implementation
- [x] 2.1 Semantic tokens wait at most 100 ms, then answer from the carried facts; a null result without facts (slice semtok).
- [x] 2.2 Carry attribute names and BSOL candidates over an edit.
- [x] 2.3 Send one `workspace/semanticTokens/refresh` per document when the newest facts are stored, only to a client with `refreshSupport`.
- [x] 2.4 Soak default budget for `textDocument/semanticTokens/full`.
## 3. Verify
- [ ] 3.1 30-minute soak with the semantic-tokens budget enforced.
