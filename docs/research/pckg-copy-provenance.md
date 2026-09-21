# pckg copy provenance

This inventory records which existing implementation is the source for each
restored target. It is migration evidence, not a second design or runtime
contract.

| Target | Source revision/path | Action | Required delta | Source deletion gate |
| --- | --- | --- | --- | --- |
| `beskid_sites/apps/pckg/package.json` | current `beskid_sites/apps/shell-template/package.json` | COPY-AND-ADAPT | pckg name/port/dependencies; retain current workspace package names | Task 11 |
| `beskid_sites/apps/pckg/vite.config.ts` | current `beskid_sites/apps/shell-template/vite.config.ts` | COPY-AND-ADAPT | pckg-specific aliases only | Task 11 |
| `beskid_sites/apps/pckg/src/lib/pckg-api.ts` | current `pckg/web/src/lib/pckg-api.ts` | COPY-AND-ADAPT | TanStack app base URL only; retain Rust-compatible methods | Task 11 |
| `beskid_sites/apps/pckg/src/lib/package-kind-presentation.ts` | current `pckg/web/src/lib/package-kind-presentation.ts` | COPY | Import paths only if required | Task 11 |
| `beskid_sites/apps/pckg/src/components/package-detail.tsx` | `fa54c08b:beskid_sites/apps/pckg/src/components/package-detail.tsx` | COPY-AND-ADAPT | current Rust DTOs and package-kind behavior | Task 11 |
| `beskid_sites/apps/pckg/src/components/package-grid.tsx` | `fa54c08b:beskid_sites/apps/pckg/src/components/package-grid.tsx` | COPY-AND-ADAPT | current DTOs and routes | Task 11 |
| `beskid_sites/apps/pckg/src/components/publisher-profile.tsx` | `fa54c08b:beskid_sites/apps/pckg/src/components/publisher-profile.tsx` | COPY-AND-ADAPT | Rust publisher summary instead of CommunityProfile | Task 11 |
| `beskid_sites/apps/pckg/src/routes/_public/packages/index.tsx` | ignored working-tree reference; not present in `fa54c08b` | COPY-AND-ADAPT | validate all behavior; do not treat as committed history | Task 11 |
| `beskid_sites/apps/pckg/src/routes/_public/packages/$name.tsx` | ignored working-tree reference; not present in `fa54c08b` | COPY-AND-ADAPT | validate all behavior; add current detail route | Task 11 |
| `beskid_sites/apps/pckg/src/components/global-search.tsx` | historical pckg app | DO-NOT-COPY | shared shell-core owns global search | N/A |
| `beskid_sites/apps/pckg/src/server/nodebb.ts` | historical pckg app | DO-NOT-COPY | no current Rust-owned NodeBB contract | N/A |
| `beskid_sites/apps/pckg/src/lib/pckg-api.ts` historical copy | `fa54c08b` | DO-NOT-COPY | retired .NET/Auth Hub/community/raw-upload calls | N/A |
| `.output`, `node_modules`, `routeTree.gen.ts` | local/generated output | DO-NOT-COPY | regenerate from tracked source | N/A |

## Rulings

- Current workspace package names are `@cyber-nomad-collective/*`, despite the
  broader naming convention in root guidance. The restored app retains the
  actual workspace names until that separate package-renaming migration is
  authorized; no runtime or .NET dependency is reintroduced.
