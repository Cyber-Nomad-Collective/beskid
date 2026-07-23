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

function headingPattern(heading: string, level: number): RegExp {
	const hashes = "#".repeat(level);
	const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	return new RegExp(`^${hashes}\\s+${escaped}\\s*$`, "m");
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
