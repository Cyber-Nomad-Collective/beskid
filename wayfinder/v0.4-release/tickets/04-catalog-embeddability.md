## Question

How should `openspec/catalog.json` be regenerated and made embeddable for the v0.4.0 release?

The v0.4 article mentions catalog revision `f011a8cb2e46` (185 caps, 524 reqs). For the final 0.4.0 release:
1. What is the canonical regeneration command? (`openspec validate-standard`, `bun run openspec:validate`, something else?)
2. Does the catalog need to be committed to the repo, or is it generated at build time?
3. What does "easily embeddable" mean — a single CLI command, a `just` recipe, a CI step?
4. Which downstream consumers (platform-spec site, website build, tracker) need to pick up the regenerated catalog?
