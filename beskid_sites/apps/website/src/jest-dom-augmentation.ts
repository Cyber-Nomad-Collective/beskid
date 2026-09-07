/**
 * Vitest assertion augmentation for @testing-library/jest-dom matchers.
 *
 * vitest's `expect` returns `Assertion<T>` declared in `@vitest/expect` (not
 * in the `vitest` re-export), so the matcher interface must be augmented on
 * `@vitest/expect`. The official `@testing-library/jest-dom/vitest` entry
 * targets `vitest`, which does not merge into the `expect` return type under
 * `moduleResolution: Bundler` + pnpm's isolated node_modules.
 *
 * The top-level `import type` is load-bearing: it makes this file a module
 * (not a script) so `declare module` AUGMENTS the real types instead of
 * shadowing them with an empty ambient declaration.
 *
 * Named as `.ts` (not `.d.ts`) so the tsconfig `include` glob picks it up.
 */
import type { TestingLibraryMatchers } from "@testing-library/jest-dom/matchers";

declare module "@vitest/expect" {
	interface Assertion<T = any> extends TestingLibraryMatchers<any, T> {}
}

declare module "vitest" {
	interface Assertion<T = any> extends TestingLibraryMatchers<any, T> {}
	interface AsymmetricMatchersContaining
		extends TestingLibraryMatchers<any, any> {}
}
