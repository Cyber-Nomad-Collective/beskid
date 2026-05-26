import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

/** Installed @beskid/docs-ui package root (npm alias → @cyber-nomad-collective/docs-ui). */
export const docsUiRoot = path.dirname(
	require.resolve('@beskid/docs-ui/shell-css'),
);

/** Absolute file URL for a file under `src/` in @beskid/docs-ui (Astro/Vite asset imports). */
export function docsUiSrcUrl(...segments) {
	return pathToFileURL(path.join(docsUiRoot, 'src', ...segments)).href;
}
