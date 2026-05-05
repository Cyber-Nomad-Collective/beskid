import type { ArticleDefaults, LayoutContractFile, LayoutPresetKey, SectionRule } from './schema';

function sections(...ids: string[]): SectionRule[] {
	return ids.map((id) => ({ id, required: true as const, kind: 'specSection' as const }));
}

/** Preset layers merged before a node’s `layout.json` (node wins). */
export function getPresetBase(preset: LayoutPresetKey): Partial<LayoutContractFile> {
	switch (preset) {
		case 'root-default':
			return {
				version: 1,
				level: 'root',
				sections: [],
				minSpecSections: 0,
				minMarkdownHeadings: 0,
			};
		case 'domain-default':
			return {
				version: 1,
				level: 'domain',
				sections: [
					{ id: 'rationale', required: true, kind: 'specSection' },
					{ id: 'background', required: false, kind: 'specSection' },
				],
				minSpecSections: 1,
			};
		case 'area-default':
			return {
				version: 1,
				level: 'area',
				sections: [
					{ id: 'scope', required: true, kind: 'specSection' },
					{ id: 'features', required: false, kind: 'specSection' },
				],
				minSpecSections: 1,
			};
		case 'area-sparse':
			return {
				version: 1,
				level: 'area',
				sections: [],
				minSpecSections: 0,
			};
		case 'feature-contract-default':
			return {
				version: 1,
				level: 'feature',
				sections: sections('what-this-feature-specifies', 'implementation-anchors'),
				minSpecSections: 2,
			};
		case 'feature-hub-default':
			return {
				version: 1,
				level: 'feature',
				sections: [],
				minSpecSections: 3,
			};
		case 'feature-area-hub-default':
			return {
				version: 1,
				level: 'feature',
				sections: [
					{ id: 'scope', required: true, kind: 'specSection' },
					{ id: 'features', required: false, kind: 'specSection' },
				],
				minSpecSections: 1,
			};
		case 'article-default':
			return {
				version: 1,
				level: 'article',
				sections: [],
				/** Articles may be MDX-first (`<SpecSection>`) or prose (`##`); stricter rules belong in per-article `*.layout.json`. */
			};
		default: {
			const _x: never = preset;
			return _x;
		}
	}
}

/** Default article contract under a feature when no `<stem>.layout.json` exists. */
export function defaultArticleDefaultsForFeature(_preset: LayoutPresetKey): ArticleDefaults {
	return { extends: 'article-default' };
}
