#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { loadStandardRouteProjection } from '../src/lib/standard-routes.mjs';

function parseExactRedirects(config) {
	const redirects = new Map();
	for (const match of config.matchAll(
		/location = ([^\s{]+) \{\s*return 301 ([^;\s]+);\s*\}/gu,
	)) {
		if (redirects.has(match[1])) throw new Error(`Duplicate Nginx exact location: ${match[1]}`);
		redirects.set(match[1], match[2]);
	}
	return redirects;
}

export function verifyNginxStandardRoutes({
	nginxConfig,
	redirectConfig,
	dockerfile,
	projection = loadStandardRouteProjection(),
}) {
	const errors = [];
	let redirects;
	try {
		redirects = parseExactRedirects(redirectConfig);
	} catch (error) {
		return [error instanceof Error ? error.message : String(error)];
	}

	if (/\$(?:request_uri|uri|args)/u.test(redirectConfig)) {
		errors.push('generated redirects interpolate request data');
	}
	for (const [legacy, capability] of projection.aliases) {
		for (const source of [`/${legacy}`, `/${legacy}/`]) {
			if (redirects.get(source) !== capability.href) {
				errors.push(`${source}: exact redirect does not target ${capability.href}`);
			}
		}
	}
	if (redirects.size !== projection.aliases.size * 2) {
		errors.push(
			`generated redirect count is ${redirects.size}; expected ${projection.aliases.size * 2}`,
		);
	}
	if (!/include\s+\/etc\/nginx\/snippets\/standard-redirects\.conf;/u.test(nginxConfig)) {
		errors.push('runtime Nginx config does not include generated Standard redirects');
	}
	if (
		!/location \^~ \/platform-spec\/ \{[\s\S]*?error_page 404 =404 \/docs\/standard\/not-found\/index\.html;[\s\S]*?try_files \$uri \$uri\/ =404;/u.test(
			nginxConfig,
		)
	) {
		errors.push('unknown Platform Spec paths do not use the fail-closed Standard page');
	}
	if (
		!dockerfile.includes(
			'COPY --from=build /app/site/website/.astro/standard-redirects.conf /etc/nginx/snippets/standard-redirects.conf',
		)
	) {
		errors.push('runtime image does not copy the generated Standard redirect include');
	}
	return errors;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	const [nginxArgument, redirectsArgument, dockerfileArgument] = process.argv.slice(2);
	if (!nginxArgument || !redirectsArgument || !dockerfileArgument) {
		console.error(
			'Usage: node scripts/verify-nginx-standard-routes.mjs <nginx-config> <redirect-config> <dockerfile>',
		);
		process.exitCode = 2;
	} else {
		const errors = verifyNginxStandardRoutes({
			nginxConfig: readFileSync(path.resolve(process.cwd(), nginxArgument), 'utf8'),
			redirectConfig: readFileSync(path.resolve(process.cwd(), redirectsArgument), 'utf8'),
			dockerfile: readFileSync(path.resolve(process.cwd(), dockerfileArgument), 'utf8'),
		});
		if (errors.length > 0) {
			console.error('Nginx Standard-route verification failed:');
			for (const error of errors) console.error(`- ${error}`);
			process.exitCode = 1;
		} else {
			console.log('Nginx Standard-route verification passed: exact aliases and unknown fallback are valid.');
		}
	}
}
