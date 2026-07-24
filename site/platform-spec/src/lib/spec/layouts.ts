// Enforceable layout descriptors, read from the native OpenSpec shape
// (openspec/layouts). Kept in lockstep with scripts/openspec/validate-layouts.ts
// which is the authority-level gate. Loader helpers use fs; pure validation lives
// in layouts-pure.ts for browser-safe imports.

import fs from "node:fs";
import path from "node:path";

import type { OpenSpecCatalogEntry } from "#/lib/spec/catalog";
import {
	type LayoutIndex,
	type LayoutRegistry,
	type LayoutValidation,
	resolveLayoutForEntry,
	type SpecLayout,
	validateLayout,
} from "#/lib/spec/layouts-pure";

export type {
	LayoutIndex,
	LayoutRegistry,
	LayoutSection,
	LayoutValidation,
	LayoutViolation,
	SpecLayout,
} from "#/lib/spec/layouts-pure";
export {
	resolveLayout,
	resolveLayoutForEntry,
	validateEntryLayout,
	validateLayout,
} from "#/lib/spec/layouts-pure";

const FALLBACK_INDEX: LayoutIndex = {
	version: 1,
	default: "_default",
	bySpecLevel: {},
};

export function layoutsDirFor(openSpecRoot: string): string {
	return path.join(openSpecRoot, "layouts");
}

export function loadLayoutRegistry(
	openSpecRoot: string,
): LayoutRegistry | null {
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

export function validateEntryLayoutWithRegistry(
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
