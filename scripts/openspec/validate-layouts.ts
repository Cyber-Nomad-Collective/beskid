#!/usr/bin/env bun
// Enforceable OpenSpec layout gate.
//
// OpenSpec is the native shape. Every capability's spec.md must conform to the
// layout resolved for its spec level (openspec/layouts/index.json). This is the
// authority-level enforcement; site/platform-spec mirrors the same descriptors
// for rendering and static seeding. Run via `bun run openspec:layouts`.

import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "../..");
const layoutsDir = path.join(repoRoot, "openspec/layouts");
const catalogPath = path.join(repoRoot, "openspec/catalog.json");

export interface LayoutSection {
	heading: string;
	level: number;
	required?: boolean;
	order?: number;
	mustContainPattern?: string;
	description?: string;
}

export interface SpecLayout {
	id: string;
	specLevel: string;
	title: string;
	description?: string;
	requireTitle?: boolean;
	sections: LayoutSection[];
	optionalSections?: LayoutSection[];
}

export interface LayoutIndex {
	version: number;
	default: string;
	bySpecLevel: Record<string, string>;
}

export interface LayoutViolation {
	code: string;
	message: string;
	heading?: string;
}

export function loadLayoutIndex(dir = layoutsDir): LayoutIndex {
	const raw = JSON.parse(
		readFileSync(path.join(dir, "index.json"), "utf8"),
	) as LayoutIndex;
	return raw;
}

export function loadLayouts(dir = layoutsDir): Map<string, SpecLayout> {
	const layouts = new Map<string, SpecLayout>();
	for (const file of readdirSync(dir)) {
		if (!file.endsWith(".json") || file === "index.json") continue;
		const layout = JSON.parse(
			readFileSync(path.join(dir, file), "utf8"),
		) as SpecLayout;
		layouts.set(layout.id, layout);
	}
	return layouts;
}

export function resolveLayout(
	specLevel: string | null | undefined,
	index: LayoutIndex,
	layouts: Map<string, SpecLayout>,
): SpecLayout | null {
	const id = (specLevel && index.bySpecLevel[specLevel]) || index.default;
	return layouts.get(id) ?? layouts.get(index.default) ?? null;
}

function headingPattern(heading: string, level: number): RegExp {
	const hashes = "#".repeat(level);
	const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	return new RegExp(`^${hashes}\\s+${escaped}\\s*$`, "m");
}

export function validateLayout(body: string, layout: SpecLayout): LayoutViolation[] {
	const violations: LayoutViolation[] = [];

	if (layout.requireTitle && !/^#\s+\S/m.test(body)) {
		violations.push({
			code: "missing-title",
			message: "spec must begin with a single `# Title` heading",
		});
	}

	for (const section of layout.sections) {
		if (section.required === false) continue;
		if (!headingPattern(section.heading, section.level).test(body)) {
			violations.push({
				code: "missing-section",
				heading: section.heading,
				message: `required ${"#".repeat(section.level)} ${section.heading} section is missing`,
			});
			continue;
		}
		if (section.mustContainPattern) {
			const pattern = new RegExp(section.mustContainPattern, "m");
			if (!pattern.test(body)) {
				violations.push({
					code: "section-content",
					heading: section.heading,
					message: `${section.heading} section must contain content matching /${section.mustContainPattern}/`,
				});
			}
		}
	}

	return violations;
}

interface CatalogEntry {
	capability?: string;
	id?: string;
	specPath?: string;
	specLevel?: string;
}

function specLevelFor(entry: CatalogEntry): string {
	if (typeof entry.specLevel === "string") return entry.specLevel;
	// The catalog assigns capabilities the feature level (see reader/loadEntry).
	return "feature";
}

function main(): void {
	if (!existsSync(catalogPath)) {
		console.error(`missing ${catalogPath}`);
		process.exit(1);
	}
	const index = loadLayoutIndex();
	const layouts = loadLayouts();
	if (layouts.size === 0) {
		console.error("no layout descriptors found under openspec/layouts");
		process.exit(1);
	}

	const catalog = JSON.parse(readFileSync(catalogPath, "utf8")) as {
		entries?: CatalogEntry[];
	};
	const entries = Array.isArray(catalog.entries) ? catalog.entries : [];

	let checked = 0;
	let failures = 0;
	for (const entry of entries) {
		const specPath = entry.specPath;
		if (!specPath) continue;
		const absolute = path.join(repoRoot, specPath);
		if (!existsSync(absolute)) continue;
		const layout = resolveLayout(specLevelFor(entry), index, layouts);
		if (!layout) continue;
		const body = readFileSync(absolute, "utf8");
		const violations = validateLayout(body, layout);
		checked += 1;
		if (violations.length > 0) {
			failures += 1;
			const name = entry.capability ?? entry.id ?? specPath;
			console.error(`\n✗ ${name} (layout: ${layout.id})`);
			for (const violation of violations) {
				console.error(`    - ${violation.message}`);
			}
		}
	}

	if (failures > 0) {
		console.error(
			`\nOpenSpec layout gate FAILED: ${failures}/${checked} capabilities violate their enforceable layout.`,
		);
		process.exit(1);
	}
	console.log(
		`OpenSpec layout gate OK: ${checked} capabilities conform to their enforceable layout.`,
	);
}

if (import.meta.main) {
	main();
}
