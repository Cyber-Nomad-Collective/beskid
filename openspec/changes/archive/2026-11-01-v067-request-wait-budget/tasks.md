## 1. Spec
- [x] 1.1 Write the delta.
## 2. Implementation
- [x] 2.1 References and signature help wait at most 100 ms, then answer from the carried facts.
- [x] 2.2 Inlay hints move over an edit; inlay hints wait at most 100 ms, then answer from the carried facts and send one `workspace/inlayHint/refresh` when the newest facts are stored, only to a client with `refreshSupport`.
- [x] 2.3 Rename, prepare rename and code actions wait at most 500 ms, then fail with `ContentModified`; they also fail with `ContentModified` when the open text version changes during the request.
- [x] 2.4 Remove the 120 s wait; the refresh task waits at most 30 s.
- [x] 2.5 Compare the stored facts with the open text without a copy of the document on each wakeup.
- [x] 2.6 The soak sends references, signature help, inlay hints, code actions, prepare rename and rename, with default budgets.
## 3. Verify
- [x] 3.1 30-minute soak with the new budgets enforced: PASS (compiler 4759d926); p95 references 103 ms, signatureHelp 102, inlayHint 102, codeAction 502, prepareRename 502, rename 501; max 957 ms (prepareRename).
## 4. State waits and code-action computation (stability-proof follow-up)
- [x] 4.1 Edit-producing requests count each wait for the server state in their 500 ms and fail with `ContentModified` past it.
- [x] 4.2 Code actions are computed on a blocking thread, cheapest first; the request waits at most 500 ms for them and answers with the actions computed by then.
- [x] 4.3 30-minute soak with `BESKID_LSP_TRACE=1`: PASS (compiler v067/soakfix2, builder load median 9.4, maximum 18.2); codeAction 375 requests, p95 500 ms, max 507 ms (before: max 1698 ms in this harness at load 18-31, 5552-6226 ms in the preview.11/12 proofs). Two answers used the computation budget; one of them stopped waiting for a 5950 ms documentation-comment parse of a 141 KB file with a syntax error.
