import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

/** Installed @beskid/beskid-ui package root (npm alias → @cyber-nomad-collective/beskid-ui). */
export const beskidUiRoot = path.dirname(
	require.resolve('@beskid/beskid-ui/shell-css'),
);

/** Absolute file URL for a file under `src/` in @beskid/beskid-ui (Astro/Vite asset imports). */
export function beskidUiSrcUrl(...segments) {
	return pathToFileURL(path.join(beskidUiRoot, 'src', ...segments)).href;
}
