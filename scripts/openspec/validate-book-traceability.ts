#!/usr/bin/env bun

import { readFileSync } from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "../..");
const catalogPath = path.join(repoRoot, "openspec/catalog.json");
const bookPathPrefix = "site/website/src/content/docs/book/";

export const technicalBookDirectories = [
	"13-reading-the-law",
	"20-doc-comments-that-are-not-lies",
	"21-ffi-and-forbidden-friendships",
] as const;

type UnknownRecord = Record<string, unknown>;

export type Catalog = {
	entries: UnknownRecord[];
	documents: UnknownRecord[];
};

export type TraceabilityResult = {
	errors: string[];
	bookLinksByCapability: Record<string, string[]>;
};

function normalizeLink(link: string): string {
	return `${link.replace(/\/+$/, "")}/`;
}

function isNarrativeException(markdown: string): boolean {
	const frontmatter = markdown.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
	return /^standardTraceability:\s*["']?narrative["']?\s*$/m.test(frontmatter?.[1] ?? "");
}

function isTechnicalBookDocument(documentPath: string): boolean {
	const relativePath = documentPath.slice(bookPathPrefix.length);
	return technicalBookDirectories.some((directory) => relativePath.startsWith(`${directory}/`));
}

function bookRoute(documentPath: string): string {
	const relativePath = documentPath.slice(bookPathPrefix.length).replace(/\.(md|mdx)$/, "");
	const segments = relativePath.split("/");
	if (segments.at(-1) === "index") segments.pop();
	return `/book/${segments.join("/")}/`;
}

function capabilityForLink(entries: UnknownRecord[], link: string): UnknownRecord | undefined {
	const normalizedLink = normalizeLink(link);
	return entries.find((entry) => {
		const links = [
			String(entry.path ?? ""),
			...((entry.legacySlugs as string[] | undefined) ?? []),
			...((entry.aliases as string[] | undefined) ?? []),
		];
		return links.some((candidate) => normalizeLink(candidate) === normalizedLink);
	});
}

export function deriveBookLinks(catalog: Catalog): Record<string, string[]> {
	const linksByCapability = new Map<string, Set<string>>();
	for (const entry of catalog.entries) linksByCapability.set(String(entry.capability), new Set());

	for (const document of catalog.documents) {
		const documentPath = String(document.path ?? "");
		if (!documentPath.startsWith(bookPathPrefix)) continue;
		for (const standardLink of (document.standardLinks as string[] | undefined) ?? []) {
			const capability = capabilityForLink(catalog.entries, standardLink);
			if (capability) linksByCapability.get(String(capability.capability))?.add(bookRoute(documentPath));
		}
	}

	return Object.fromEntries(
		[...linksByCapability.entries()].map(([capability, links]) => [capability, [...links].sort()]),
	);
}

export function validateBookTraceability({
	catalog,
	bookRoot,
}: {
	catalog: Catalog;
	bookRoot: string;
}): TraceabilityResult {
	const errors: string[] = [];
	for (const document of catalog.documents) {
		const documentPath = String(document.path ?? "");
		if (!documentPath.startsWith(bookPathPrefix) || !isTechnicalBookDocument(documentPath)) continue;

		const sourcePath = path.join(bookRoot, documentPath.slice(bookPathPrefix.length));
		const markdown = readFileSync(sourcePath, "utf8");
		if (isNarrativeException(markdown)) continue;

		const hasResolvableLink = ((document.standardLinks as string[] | undefined) ?? []).some((link) =>
			Boolean(capabilityForLink(catalog.entries, link)),
		);
		if (!hasResolvableLink) {
			errors.push(`Technical Book document lacks a resolvable canonical standard link: ${documentPath}`);
		}
	}

	return { errors, bookLinksByCapability: deriveBookLinks(catalog) };
}

if (import.meta.main) {
	const catalog = JSON.parse(readFileSync(catalogPath, "utf8")) as Catalog;
	const result = validateBookTraceability({
		catalog,
		bookRoot: path.join(repoRoot, bookPathPrefix),
	});
	if (result.errors.length > 0) throw new Error(result.errors.join("\n"));
	const linkedCapabilities = Object.values(result.bookLinksByCapability).filter((links) => links.length > 0).length;
	console.log(`Book traceability valid: ${linkedCapabilities} capabilities linked from the Book.`);
}
