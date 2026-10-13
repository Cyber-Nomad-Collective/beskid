## 1. Validate and introduce the normative contract

- [x] 1.1 Add the Core.Args ABI-v5 OpenSpec delta and run strict change validation.
- [x] 1.2 Merge the approved delta into the canonical Core.Args specification.
- [x] 1.3 Regenerate the catalog with the repository-owned generator and run strict standard validation.

## 2. Migrate the implementation

- [ ] 2.1 Grant only canonical `Core/Args/Args.bd` the two private Corelib services.
- [ ] 2.2 Generate manifest-owned Linux x86-64, macOS arm64, and Windows x86-64 adapters.
- [ ] 2.3 Capture AOT arguments and add the explicit JIT argument-vector API.

## 3. Delete retired paths

- [ ] 3.1 Remove `__args_all` ABI declarations, raw imports, and compatibility fallbacks after direct replacements pass.

## 4. Verify

- [ ] 4.1 Prove canonical-source denial, bounds, lifetime, and public Core.Args behavior.
- [ ] 4.2 Prove installed debug/release kit provenance and argv behavior on all three supported targets.
- [ ] 4.3 Prove JIT explicit injection and stable shared/library denial.
