/**
 * Resolve Starlight docs site root for trudoc CLIs.
 * - `--site-root <path>` or `--site-root=<path>` sets `BESKID_WEBSITE_ROOT` for spawned `.mjs` validators.
 * - Without flag, uses {@link resolveSiteRoot} (typically `process.cwd()` when run from `site/website`).
 */
import path from 'node:path';
import { resolveSiteRoot } from '../layout/scan';

export function resolveTrudocWebsiteRoot(argv: string[], cliImportMetaUrl: string): string {
	let raw: string | undefined;
	const i = argv.indexOf('--site-root');
	if (i >= 0 && argv[i + 1]) raw = argv[i + 1];
	const eqArg = argv.find((a) => a.startsWith('--site-root='));
	if (eqArg) raw = eqArg.slice('--site-root='.length).trim();
	if (raw) {
		const abs = path.resolve(raw);
		process.env.BESKID_WEBSITE_ROOT = abs;
		return abs;
	}
	return resolveSiteRoot(cliImportMetaUrl);
}
