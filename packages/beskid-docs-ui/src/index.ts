/**
 * Beskid docs shell: Starlight overrides, platform-spec reader chrome, and client scripts.
 * Import Astro components via `@beskid/docs-ui/platform-spec/…` or `@beskid/docs-ui/starlight/…`.
 */

export { BESKID_SERVICES, type BeskidService, type BeskidServiceIcon } from './data/beskid-services';
export { hubIconSvg, hubLauncherIconSvg, type BeskidHubIcon } from './hub/icons';
export { BeskidHub, type BeskidHubProps } from './react/BeskidHub';
export { initBeskidHub } from './client/beskid-hub';
