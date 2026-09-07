// Beskid Normative Manifest loader.
//
// Reads the chapter JSON documents under content/manifest/, assembles them
// into a single Manifest in declared order, validates that every entry has at
// least one source reference and at least one capability reference (per the
// standard-normative-manifest spec), and memoizes the result. The manifest
// reflects the current openspec/catalog.json revision so the served and
// exported manifest stays in sync with the catalog.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type {
	Manifest,
	ManifestChapter,
	ManifestEntry,
} from "#/lib/manifest/types";
import { loadOpenSpecCatalog } from "#/lib/spec/catalog";

/** Chapter file ids in declared order. */
const CHAPTER_IDS = [
	"introduction",
	"syntax-index",
	"corelib-runtime",
	"isle-lowering",
	"error-index",
] as const;

const MANIFEST_TITLE = "Beskid Normative Manifest";
const MANIFEST_VERSION = "1.0.0";

/** Resolve the content/manifest directory relative to this module. */
function resolveManifestDir(): string {
	const here = path.dirname(fileURLToPath(import.meta.url));
	// src/lib/manifest/loader.ts -> ../../../content/manifest
	return path.resolve(here, "..", "..", "..", "content", "manifest");
}

/** Read and parse one chapter JSON document. */
function readChapter(chapterId: string, manifestDir: string): ManifestChapter {
	const file = path.join(manifestDir, `${chapterId}.json`);
	const raw = fs.readFileSync(file, "utf8");
	return JSON.parse(raw) as ManifestChapter;
}

/** Validate that every entry in every chapter has at least one source and one capability. */
export function validateSources(chapters: ManifestChapter[]): void {
	for (const chapter of chapters) {
		for (const section of chapter.sections) {
			for (const entry of section.entries) {
				validateEntry(entry, chapter.id, section.id);
			}
		}
	}
}

function validateEntry(
	entry: ManifestEntry,
	chapterId: string,
	sectionId: string,
): void {
	const where = `${chapterId}/${sectionId}/${entry.id}`;
	if (!entry.references) {
		throw new Error(`Manifest entry ${where} has no references`);
	}
	if (entry.references.sources.length === 0) {
		throw new Error(
			`Manifest entry ${where} has no source file reference; the spec requires at least one`,
		);
	}
	if (entry.references.capabilities.length === 0) {
		throw new Error(
			`Manifest entry ${where} has no capability reference; the spec requires at least one`,
		);
	}
}

let cachedManifest: Manifest | null = null;

/** Load and assemble the full Normative Manifest. Memoized. */
export function loadManifest(): Manifest {
	if (cachedManifest) return cachedManifest;
	cachedManifest = buildManifest();
	return cachedManifest;
}

/** Build the manifest from the chapter files. Not memoized. */
export function buildManifest(): Manifest {
	const manifestDir = resolveManifestDir();
	const chapters = CHAPTER_IDS.map((id) => readChapter(id, manifestDir));
	chapters.sort((a, b) => a.order - b.order);
	validateSources(chapters);

	let catalogRevision: string | null = null;
	try {
		catalogRevision = loadOpenSpecCatalog().revision ?? null;
	} catch {
		catalogRevision = null;
	}

	return {
		title: MANIFEST_TITLE,
		version: MANIFEST_VERSION,
		catalogRevision,
		chapters,
	};
}

/** Test/CLI helper to drop the memoized manifest. */
export function clearManifestCache(): void {
	cachedManifest = null;
}
