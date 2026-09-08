#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const SITE_ORIGIN = "https://beskid-lang.org";
const REQUIRED_ROUTES = [
	"/book/reference/lsp/",
	"/book/reference/projects/",
];

function walkHtml(dir) {
	const files = [];
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			files.push(...walkHtml(fullPath));
		} else if (entry.isFile() && entry.name.endsWith(".html")) {
			files.push(fullPath);
		}
	}
	return files;
}

function routeForFile(distDir, filePath) {
	const relative = path.relative(distDir, filePath).split(path.sep).join("/");
	if (relative === "index.html") return "/";
	if (relative.endsWith("/index.html")) {
		return "/" + relative.slice(0, -"index.html".length);
	}
	return "/" + relative;
}

function fileForRoute(distDir, pathname) {
	let decoded;
	try {
		decoded = decodeURIComponent(pathname);
	} catch {
		return null;
	}
	const relative = decoded.replace(/^\/+/, "");
	const candidates = decoded.endsWith("/")
		? [path.join(distDir, relative, "index.html")]
		: [
				path.join(distDir, relative),
				path.join(distDir, relative, "index.html"),
				path.join(distDir, relative + ".html"),
			];
	for (const candidate of candidates) {
		if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
	}
	return null;
}

function extractMain(html) {
	return html.match(/<main\b[\s\S]*?<\/main>/i)?.[0] ?? html;
}

function extractAttributeValues(html, attribute) {
	const values = [];
	const expression = new RegExp(
		"\\b" + attribute + "\\s*=\\s*(?:\"([^\"]*)\"|'([^']*)')",
		"gi",
	);
	for (const match of html.matchAll(expression)) {
		values.push(match[1] ?? match[2] ?? "");
	}
	return values;
}

function describeHref(sourceRoute, href) {
	try {
		return new URL(href, SITE_ORIGIN + sourceRoute);
	} catch {
		return null;
	}
}

function verifyBuiltDocs(distDir) {
	const errors = [];
	if (!existsSync(distDir) || !statSync(distDir).isDirectory()) {
		return ["build output directory does not exist: " + distDir];
	}

	const htmlFiles = walkHtml(distDir);
	const htmlByFile = new Map(
		htmlFiles.map((filePath) => [filePath, readFileSync(filePath, "utf8")]),
	);

	for (const requiredRoute of REQUIRED_ROUTES) {
		if (!fileForRoute(distDir, requiredRoute)) {
			errors.push(requiredRoute + ": required rendered route is missing");
		}
	}

	const docsFiles = htmlFiles.filter((filePath) => {
		const route = routeForFile(distDir, filePath);
		return route === "/docs/" || route.startsWith("/docs/");
	});

	for (const filePath of docsFiles) {
		const sourceRoute = routeForFile(distDir, filePath);
		const html = htmlByFile.get(filePath);
		const h1Count = (html.match(/<h1\b/gi) ?? []).length;
		if (h1Count !== 1) {
			errors.push(sourceRoute + ": expected exactly one H1, found " + h1Count);
		}

		const main = extractMain(html);
		for (const href of extractAttributeValues(main, "href")) {
			if (
				!href ||
				href.startsWith("mailto:") ||
				href.startsWith("tel:") ||
				href.startsWith("javascript:")
			) {
				continue;
			}
			const targetUrl = describeHref(sourceRoute, href);
			if (!targetUrl || targetUrl.origin !== SITE_ORIGIN) continue;

			const targetFile = fileForRoute(distDir, targetUrl.pathname);
			if (!targetFile) {
				errors.push(
					sourceRoute + ": internal route does not resolve: " + targetUrl.pathname,
				);
				continue;
			}

			if (!targetUrl.hash) continue;
			let anchor;
			try {
				anchor = decodeURIComponent(targetUrl.hash.slice(1));
			} catch {
				errors.push(sourceRoute + ": malformed anchor: " + href);
				continue;
			}
			const targetHtml =
				htmlByFile.get(targetFile) ?? readFileSync(targetFile, "utf8");
			const ids = new Set([
				...extractAttributeValues(targetHtml, "id"),
				...extractAttributeValues(targetHtml, "name"),
			]);
			if (!ids.has(anchor)) {
				errors.push(
					sourceRoute +
						": anchor does not resolve: " +
						targetUrl.pathname +
						targetUrl.hash,
				);
			}
		}
	}

	const notFoundPath = path.join(distDir, "404.html");
	const homePath = path.join(distDir, "index.html");
	if (!existsSync(notFoundPath)) {
		errors.push("/404.html: explicit 404 output is missing");
	} else {
		const notFoundHtml = readFileSync(notFoundPath, "utf8");
		const notFoundH1Count = (notFoundHtml.match(/<h1\b/gi) ?? []).length;
		if (notFoundH1Count !== 1 || !/<h1\b[^>]*>\s*404\s*<\/h1>/i.test(notFoundHtml)) {
			errors.push("/404.html: explicit 404 output must render one 404 H1");
		}
		if (existsSync(homePath) && notFoundHtml === readFileSync(homePath, "utf8")) {
			errors.push("/404.html: explicit 404 output must not render the home page");
		}
	}

	return [...new Set(errors)].sort();
}

const distArgument = process.argv[2];
if (!distArgument) {
	console.error("Usage: node scripts/verify-built-docs.mjs <dist-directory>");
	process.exitCode = 2;
} else {
	const distDir = path.resolve(process.cwd(), distArgument);
	const errors = verifyBuiltDocs(distDir);
	if (errors.length > 0) {
		console.error("Built Docs verification failed:");
		for (const error of errors) console.error("- " + error);
		process.exitCode = 1;
	} else {
		console.log(
			"Built Docs verification passed: routes, anchors, H1 headings, and 404 output are valid.",
		);
	}
}

export { verifyBuiltDocs };
