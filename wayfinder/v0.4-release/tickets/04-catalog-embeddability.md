## Question

How should `openspec/catalog.json` be regenerated and made embeddable for the v0.4.0 release?

The v0.4 article mentions catalog revision `f011a8cb2e46` (185 caps, 524 reqs). For the final 0.4.0 release:
1. What is the canonical regeneration command? (`openspec validate-standard`, `bun run openspec:validate`, something else?)
2. Does the catalog need to be committed to the repo, or is it generated at build time?
3. What does "easily embeddable" mean — a single CLI command, a `just` recipe, a CI step?
4. Which downstream consumers (platform-spec site, website build, tracker) need to pick up the regenerated catalog?

## Resolution

**Resolved 2026-08-11.** Catalog regeneration and embeddability validation are now defined with a reproducible command chain:

- `pnpm openspec:catalog` rebuilds `openspec/catalog.json` in place (this repo’s command outputs the new revision and artifact path).
- `pnpm openspec:validate` verifies canonical spec health after catalog generation (`openspec` standard + traceability + layouts + strict validate). Current pass: **206 passed, 0 failed**.
- Rebuilt catalog is now committed in-repo as `openspec/catalog.json` revision `0cdc1bfda83c` for stable downstream pickup.
- Downstream consumers should read the updated file directly from repo and/or pull it through the build pipeline that invokes these commands before release evidence capture.
