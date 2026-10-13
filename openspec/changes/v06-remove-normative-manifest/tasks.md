## 1. Remove
- [x] 1.1 Write REMOVED deltas for every `standard-normative-manifest` requirement and validate the change strictly.
- [ ] 1.2 At release, archive with `openspec archive v06-remove-normative-manifest -y --skip-specs`, delete `openspec/specs/standard-normative-manifest/`, regenerate `openspec/catalog.json` and run `pnpm run openspec:validate`. OpenSpec 1.6.0 refuses to apply these deltas because a spec must keep at least one requirement (checked by a dry run on a copy of `openspec/` on 2026-10-13).
