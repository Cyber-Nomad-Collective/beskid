// Enforceable layout descriptors, read from the native OpenSpec shape
// (openspec/layouts). Kept in lockstep with scripts/openspec/validate-layouts.ts
// which is the authority-level gate. This module is pure (no server-only /
// database imports) so it runs inside the server bundle and the seed scripts.

import fs from "node:fs";
import path from "node:path";

import type { OpenSpecCatalogEntry } from "#/lib/spec/catalog";

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

export interface LayoutValidation {
	layoutId: string | null;
	ok: boolean;
	violations: LayoutViolation[];
}

export interface LayoutRegistry {
	index: LayoutIndex;
	layouts: Map<string, SpecLayout>;
}

const FALLBACK_INDEX: LayoutIndex = {
	version: 1,
	default: "_default",
	bySpecLevel: {},
};

export function layoutsDirFor(openSpecRoot: string): string {
	return path.join(openSpecRoot, "layouts");
}

export function loadLayoutRegistry(openSpecRoot: string): LayoutRegistry | null {
	const dir = layoutsDirFor(openSpecRoot);
	if (!fs.existsSync(dir)) return null;
	const layouts = new Map<string, SpecLayout>();
	let index: LayoutIndex = FALLBACK_INDEX;
	for (const file of fs.readdirSync(dir)) {
		if (!file.endsWith(".json")) continue;
		const raw = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
		if (file === "index.json") {
			index = { ...FALLBACK_INDEX, ...raw };
			continue;
		}
		if (raw && typeof raw.id === "string") {
			layouts.set(raw.id, raw as SpecLayout);
		}
	}
	if (layouts.size === 0) return null;
	return { index, layouts };
}

export function resolveLayout(
	specLevel: string | null | undefined,
	registry: LayoutRegistry,
): SpecLayout | null {
	const id =
		(specLevel && registry.index.bySpecLevel[specLevel]) ||
		registry.index.default;
	return (
		registry.layouts.get(id) ??
		registry.layouts.get(registry.index.default) ??
		null
	);
}

export function resolveLayoutForEntry(
	entry: OpenSpecCatalogEntry,
	registry: LayoutRegistry,
): SpecLayout | null {
	return resolveLayout(entry.specLevel, registry);
}

function headingPattern(heading: string, level: number): RegExp {
	const hashes = "#".repeat(level);
	const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	return new RegExp(`^${hashes}\\s+${escaped}\\s*$`, "m");
}

export function validateLayout(
	body: string,
	layout: SpecLayout,
): LayoutViolation[] {
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

export function validateEntryLayout(
	body: string,
	entry: OpenSpecCatalogEntry,
	registry: LayoutRegistry | null,
): { layout: SpecLayout | null; validation: LayoutValidation } {
	if (!registry) {
		return {
			layout: null,
			validation: { layoutId: null, ok: true, violations: [] },
		};
	}
	const layout = resolveLayoutForEntry(entry, registry);
	if (!layout) {
		return {
			layout: null,
			validation: { layoutId: null, ok: true, violations: [] },
		};
	}
	const violations = validateLayout(body, layout);
	return {
		layout,
		validation: {
			layoutId: layout.id,
			ok: violations.length === 0,
			violations,
		},
	};
}
