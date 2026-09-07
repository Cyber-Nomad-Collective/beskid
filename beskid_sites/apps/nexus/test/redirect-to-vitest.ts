/**
 * Preloaded by bunfig.toml when someone runs bare `bun test`.
 * Unit suites require Vitest/jsdom; E2E requires Playwright.
 */
throw new Error(
	"Do not use `bun test` in gitnexus-web. " +
		"Use `bun run test` (Vitest/jsdom unit) or `bun run test:e2e` (Playwright).",
);
