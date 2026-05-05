/** Extract structural signals from raw MDX/Markdown source (no full MDX parse). */

const specSectionIdRe = /<SpecSection[^>]*\bid\s*=\s*["']([^"']+)["']/gi;
const specSectionTitleRe = /<SpecSection[^>]*\btitle\s*=\s*["']([^"']+)["']/gi;
const mdH2Re = /^##\s+(.+)$/gm;

export type BodySignals = {
	specSectionIds: Set<string>;
	specSectionTitles: Set<string>;
	markdownH2: string[];
};

export function extractBodySignals(source: string): BodySignals {
	const specSectionIds = new Set<string>();
	let m: RegExpExecArray | null;
	specSectionIdRe.lastIndex = 0;
	while ((m = specSectionIdRe.exec(source)) !== null) {
		specSectionIds.add(m[1]);
	}
	const specSectionTitles = new Set<string>();
	specSectionTitleRe.lastIndex = 0;
	while ((m = specSectionTitleRe.exec(source)) !== null) {
		specSectionTitles.add(slugifyTitle(m[1]));
	}
	const markdownH2: string[] = [];
	mdH2Re.lastIndex = 0;
	while ((m = mdH2Re.exec(source)) !== null) {
		markdownH2.push(m[1].trim());
	}
	return { specSectionIds, specSectionTitles, markdownH2 };
}

function slugifyTitle(title: string): string {
	return title
		.toLowerCase()
		.trim()
		.replace(/\s+/g, '-')
		.replace(/[^a-z0-9-]/g, '');
}

export function hasSpecSection(signals: BodySignals, sectionId: string): boolean {
	if (signals.specSectionIds.has(sectionId)) return true;
	if (signals.specSectionTitles.has(sectionId)) return true;
	return false;
}

/** Treat `feature-index` as satisfying a `features` section rule (and vice versa). */
export function satisfiesSpecSectionRule(signals: BodySignals, sectionId: string): boolean {
	if (hasSpecSection(signals, sectionId)) return true;
	if (sectionId === 'features' && hasSpecSection(signals, 'feature-index')) return true;
	if (sectionId === 'feature-index' && hasSpecSection(signals, 'features')) return true;
	return false;
}

export function hasMarkdownH2(signals: BodySignals, slug: string): boolean {
	const want = slug.toLowerCase();
	return signals.markdownH2.some((h) => slugifyTitle(h) === want);
}
