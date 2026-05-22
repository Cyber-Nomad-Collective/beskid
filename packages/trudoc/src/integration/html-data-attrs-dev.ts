import type { Plugin } from 'vite';
import type { TrudocHtmlDataAttrsOptions } from './html-data-attrs-options';

function injectAttrs(html: string, cfg: TrudocHtmlDataAttrsOptions, isMapIndex: boolean): string {
	let out = html;
	const htmlOpen = out.match(/<html[^>]*>/)?.[0] ?? '';
	if (!htmlOpen.includes(cfg.docAttr) && out.includes('<html')) {
		out = out.replace('<html', `<html ${cfg.docAttr}`);
	}
	if (isMapIndex && cfg.mapAttr) {
		const openAfter = out.match(/<html[^>]*>/)?.[0] ?? '';
		if (!openAfter.includes(cfg.mapAttr) && out.includes('<html')) {
			out = out.replace('<html', `<html ${cfg.mapAttr}`);
		}
	}
	return out;
}

/**
 * Dev-server parity with post-build HTML tagging for doc area pages.
 */
export function createDocAreaHtmlAttrsDevPlugin(cfg: TrudocHtmlDataAttrsOptions): Plugin {
	const prefix = `/${cfg.htmlSubdir}`;
	const mapPaths = new Set([prefix, `${prefix}/`]);

	return {
		name: `trudoc-html-attrs-dev-${cfg.htmlSubdir}`,
		apply: 'serve',
		configureServer(server) {
			server.middlewares.use((req, res, next) => {
				const pathname = (req.url ?? '').split('?')[0] ?? '';
				if (!pathname.startsWith(prefix)) {
					next();
					return;
				}

				const isMapIndex =
					mapPaths.has(pathname.replace(/\/+$/, '') || pathname) ||
					pathname === prefix ||
					pathname === `${prefix}/`;

				const chunks: Buffer[] = [];
				const originalWrite = res.write.bind(res);
				const originalEnd = res.end.bind(res);

				res.write = ((chunk: unknown, ...args: unknown[]) => {
					if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as string));
					return true;
				}) as typeof res.write;

				res.end = ((chunk?: unknown, ...args: unknown[]) => {
					if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as string));
					const ctype = res.getHeader('content-type');
					const isHtml = typeof ctype === 'string' && ctype.includes('text/html');
					let body = Buffer.concat(chunks).toString('utf8');
					if (isHtml && body.includes('<html')) {
						body = injectAttrs(body, cfg, isMapIndex);
					}
					return (originalEnd as (c?: unknown, ...a: unknown[]) => ReturnType<typeof res.end>)(
						body,
						...args,
					);
				}) as typeof res.end;

				next();
			});
		},
	};
}

/** @deprecated Use {@link createDocAreaHtmlAttrsDevPlugin}. */
export const createPlatformSpecHtmlAttrsDevPlugin = createDocAreaHtmlAttrsDevPlugin;
