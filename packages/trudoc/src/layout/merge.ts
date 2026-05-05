import type { ArticleDefaults, LayoutContractFile, LayoutPresetKey, SectionRule, WidgetSpec } from './schema';
import { getPresetBase } from './presets';

/** Later entries win so node `layout.json` can override preset section rules. */
function dedupeSectionsLastWins(rules: SectionRule[]): SectionRule[] {
	const out: SectionRule[] = [];
	for (const r of rules) {
		const i = out.findIndex((o) => o.id === r.id);
		if (i >= 0) out[i] = r;
		else out.push(r);
	}
	return out;
}

function mergeSections(a: SectionRule[] | undefined, b: SectionRule[] | undefined): SectionRule[] {
	return dedupeSectionsLastWins([...(a ?? []), ...(b ?? [])]);
}

function mergeWidgets(a: WidgetSpec[] | undefined, b: WidgetSpec[] | undefined): WidgetSpec[] {
	return [...(a ?? []), ...(b ?? [])];
}

/**
 * Merges preset (from `extends`) with an optional parent file, then the node file.
 * Later arguments override scalars; sections/widgets concatenate (deduped by section id).
 */
export function mergeLayoutContract(
	node: LayoutContractFile,
	options: { parent?: LayoutContractFile; presetFromExtends?: LayoutPresetKey } = {},
): LayoutContractFile {
	const chain: LayoutContractFile[] = [];

	if (options.presetFromExtends) {
		const base = getPresetBase(options.presetFromExtends);
		chain.push({ ...base, level: node.level } as LayoutContractFile);
	}
	if (options.parent) chain.push(options.parent);
	chain.push(node);

	let merged: LayoutContractFile = { ...chain[0] };
	for (let i = 1; i < chain.length; i++) {
		const next = chain[i];
		merged = {
			version: 1,
			level: next.level,
			extends: next.extends ?? merged.extends,
			sections: mergeSections(merged.sections, next.sections),
			/** Later layers win so `layout.json` can tighten or relax thresholds vs presets. */
			minSpecSections: next.minSpecSections ?? merged.minSpecSections,
			minMarkdownHeadings: next.minMarkdownHeadings ?? merged.minMarkdownHeadings,
			widgets: mergeWidgets(merged.widgets, next.widgets),
			pathPrefix: next.pathPrefix ?? merged.pathPrefix,
			tilesHeading: next.tilesHeading ?? merged.tilesHeading,
			articleDefaults: next.articleDefaults ?? merged.articleDefaults,
			documentStructure: next.documentStructure ?? merged.documentStructure,
			childArticles: next.childArticles ?? merged.childArticles,
			validators: { ...merged.validators, ...next.validators },
		};
	}
	return merged;
}

/** Build `EffectiveLayout` view for scanners / UI. */
export function toEffectiveLayout(merged: LayoutContractFile): import('./schema').EffectiveLayout {
	return {
		...merged,
		effectiveSections: dedupeSectionsLastWins(merged.sections ?? []),
		effectiveMinSpecSections: merged.minSpecSections,
		effectiveMinMarkdownHeadings: merged.minMarkdownHeadings,
		effectiveWidgets: merged.widgets ?? [],
		effectiveDocumentStructure: merged.documentStructure,
		effectiveChildArticles: merged.childArticles,
	};
}

export function mergeArticleDefaults(
	base: ArticleDefaults | undefined,
	override: ArticleDefaults | undefined,
): ArticleDefaults {
	if (!base && !override) return {};
	if (!base) return { ...override } as ArticleDefaults;
	if (!override) return { ...base };
	return {
		extends: override.extends ?? base.extends,
		sections: dedupeSectionsLastWins([...(base.sections ?? []), ...(override.sections ?? [])]),
		minSpecSections: override.minSpecSections ?? base.minSpecSections,
		minMarkdownHeadings: override.minMarkdownHeadings ?? base.minMarkdownHeadings,
		widgets: mergeWidgets(base.widgets, override.widgets),
		documentStructure: override.documentStructure ?? base.documentStructure,
	};
}
