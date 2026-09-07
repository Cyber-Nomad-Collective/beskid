#!/usr/bin/env node
/**
 * One-shot content migration script.
 *
 * Copies the Astro website's MDX/MD corpus from
 *   site/website/src/content/docs/{book,blog}
 * into the TanStack Start website app at
 *   beskid_sites/apps/website/src/content/{book,blog}
 * and rewrites Astro-specific constructs to plain MDX that the
 * `@mdx-js/rollup` plugin + a React MDXProvider can render.
 *
 * Run from the beskid repo root:
 *   node beskid_sites/apps/website/scripts/import-content.mjs
 */
import { cp, mkdir, rm, readdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const SRC_ROOT = path.resolve(
	process.cwd(),
	"site/website/src/content/docs",
);
const DEST_ROOT = path.resolve(
	process.cwd(),
	"beskid_sites/apps/website/src/content",
);

const SECTIONS = ["book", "blog"];

// Files that are entirely page-component driven on the Astro side
// (LandingTemplate / DownloadsPage / ReleaseBlogIndex). The TanStack app
// renders dedicated React routes for these instead of importing MDX.
const SKIP_FILES = new Set([
	"index.mdx",
	"downloads.mdx",
	"blog/index.mdx",
]);

// Import specifiers to strip entirely (components are provided via MDXProvider
// or replaced inline).
const STRIP_IMPORT_PATTERNS = [
	/@astrojs\/starlight\/components/,
	/astro-embed/,
	/\.astro["']?\s*;?\s*$/,
	/\.\.\/\.\.\/\.\.\/components\/BlogIndex\.astro/,
	/\.\.\/\.\.\/components\/ReleaseBlogIndex\.astro/,
	/\.\.\/components\/DownloadsPage\.astro/,
	/\.\.\/components\/LandingTemplate\.astro/,
	/\.\.\/\.\.\/\.\.\/\.\.\/components\/LinkedAstFactsShell\.astro/,
];

/**
 * Rewrite a single MDX/MD file's text so it compiles under `@mdx-js/rollup`
 * without Astro. Idempotent and safe to re-run.
 */
function rewriteContent(src, relPath) {
	let out = src;

	// 1. Drop Astro-specific import lines.
	out = out
		.split("\n")
		.filter((line) => {
			const trimmed = line.trim();
			if (!trimmed.startsWith("import ")) return true;
			return !STRIP_IMPORT_PATTERNS.some((re) => re.test(trimmed));
		})
		.join("\n");

	// 2. Replace `<LinkedAstFactsShell ... />` (multi-line, self-closing) with a
	//    plain note. The interactive graph viewer is not ported in this pass.
	out = out.replace(
		/<LinkedAstFactsShell[\s\S]*?\/>/g,
		'> **Note:** The interactive AST/facts graph viewer is not available in this build of the website. See `beskid_nexus` for the graph explorer.',
	);

	// 3. Replace standalone `<BlogIndex />` embeds with a link to the blog index.
	out = out.replace(
		/<BlogIndex\s*\/>/g,
		'[See all blog posts →](/blog)',
	);

	// 4. Astro `Code` component usage from `astro:components` is rare in the
	//    corpus; leave code fences as-is (remark-gfm handles them).

	// 5. Normalise trailing whitespace.
	out = `${out.trimEnd()}\n`;

	return out;
}

async function importSection(section) {
	const srcDir = path.join(SRC_ROOT, section);
	const destDir = path.join(DEST_ROOT, section);
	if (!existsSync(srcDir)) {
		console.warn(`  ! source missing: ${srcDir}`);
		return;
	}
	if (existsSync(destDir)) {
		await rm(destDir, { recursive: true, force: true });
	}
	await mkdir(destDir, { recursive: true });

	// Copy the whole tree first (preserves structure incl. nav.order.json),
	// then rewrite MDX/MD files in place.
	await cp(srcDir, destDir, { recursive: true });

	await rewriteTree(destDir, section);
}

async function rewriteTree(dir, section) {
	const entries = await readdir(dir, { withFileTypes: true });
	for (const entry of entries) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			await rewriteTree(full, section);
			continue;
		}
		if (!/\.(mdx|md)$/i.test(entry.name)) continue;

		const relPath = path.join(section, path.relative(DEST_ROOT, dir), entry.name);
		if (SKIP_FILES.has(path.join(section, entry.name))) {
			continue;
		}

		const raw = await readFile(full, "utf8");
		const rewritten = rewriteContent(raw, relPath);
		await writeFile(full, rewritten, "utf8");
	}
}

async function main() {
	if (!existsSync(SRC_ROOT)) {
		console.error(`Source content not found: ${SRC_ROOT}`);
		process.exit(1);
	}
	await mkdir(DEST_ROOT, { recursive: true });
	for (const section of SECTIONS) {
		console.log(`importing ${section}/`);
		await importSection(section);
	}
	console.log("done.");
}

await main();
