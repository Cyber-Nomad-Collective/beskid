/** Tutorial chapter folder at manifest top level, e.g. `12-the-normative-bible`. */
const TUTORIAL_CHAPTER_ROOT = /^(\d{2})-[^/]+$/;

/**
 * Strip hand-maintained chapter/section prefixes from book frontmatter titles
 * so {@link buildTutorialDisplayTitleBySlug} can assign numbers from `nav.order.json`.
 */
export function stripManualBookNumberPrefix(title: string): string {
	return title
		.trim()
		.replace(/^\d{1,2}\.\d{1,2}\s+/, '')
		.replace(/^\d{1,2}\.\s+/, '')
		.replace(/^\d+\.\s+/, '')
		.trim();
}

/** `00` → chapter 1; `08` → `08`; `12` → `12` (matches tutorial folder prefixes). */
export function chapterLabelFromFolderPrefix(twoDigit: string): string {
	if (twoDigit === '00') return '1';
	return twoDigit.startsWith('0') ? twoDigit : String(parseInt(twoDigit, 10));
}

function entryToSlug(entry: string): string {
	return entry === 'index' ? 'book' : `book/${entry}`;
}

/**
 * Build display titles for the flat tutorial manifest (chapter roots and nested pages).
 * Chapter roots use the `NN-` folder prefix; nested pages use `N.M`.
 */
export function buildTutorialDisplayTitleBySlug(
	entries: string[],
	rawTitleForEntry: (entry: string) => string,
): Record<string, string> {
	const out: Record<string, string> = {};
	let chapterLabel: string | null = null;
	let sectionNum = 0;
	let chapterPrefix: string | null = null;

	for (const entry of entries) {
		const slug = entryToSlug(entry);
		const stripped = stripManualBookNumberPrefix(rawTitleForEntry(entry));

		if (entry === 'index') {
			out[slug] = stripped;
			continue;
		}

		const chapterMatch = entry.match(TUTORIAL_CHAPTER_ROOT);
		if (chapterMatch) {
			chapterLabel = chapterLabelFromFolderPrefix(chapterMatch[1]!);
			sectionNum = 0;
			chapterPrefix = entry;
			out[slug] = `${chapterLabel}. ${stripped}`;
			continue;
		}

		if (chapterPrefix && chapterLabel && entry.startsWith(`${chapterPrefix}/`)) {
			sectionNum += 1;
			out[slug] = `${chapterLabel}.${sectionNum} ${stripped}`;
			continue;
		}

		out[slug] = stripped;
	}

	return out;
}

export function displayTitleForSlug(
	displayTitleBySlug: Record<string, string>,
	slug: string,
	fallbackTitle: string,
): string {
	return displayTitleBySlug[slug] ?? stripManualBookNumberPrefix(fallbackTitle);
}
