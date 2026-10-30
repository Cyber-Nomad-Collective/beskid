## 1. Spec
- [x] 1.1 Write the name-resolution and registry deltas.
## 2. Implementation
- [x] 2.1 Constants through the inline-module scope chain (resolver and query layer).
- [x] 2.2 `use` scoped to its module (resolver aliases and origins; query-layer import edges with scope).
- [x] 2.3 Type positions see only types; imported type beside a same-named module or function.
- [x] 2.4 Ambiguous module qualifier: E1104 in the resolver, no declaration in the query layer.
- [x] 2.5 Duplicate rule per scope; duplicate tests are E1102 only.
## 3. Verification
- [x] 3.1 Resolver, staged-rule and query-layer unit tests; CLI check and test cases.
- [ ] 3.2 Corelib `check --all-members`, Corelib test targets, Book blocks, templates and beskid-lings solutions at integration.
