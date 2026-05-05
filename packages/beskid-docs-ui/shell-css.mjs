import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));

/** Paths for Starlight `customCss` (resolved from this package root). */
export const docsShellCustomCss = [
	path.join(root, 'src/styles/theme.material.css'),
	path.join(root, 'src/styles/starlight-layout.css'),
	path.join(root, 'src/styles/platform-spec.css'),
];
