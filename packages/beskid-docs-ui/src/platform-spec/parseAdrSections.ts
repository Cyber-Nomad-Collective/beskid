export type AdrSectionKey = 'context' | 'decision' | 'consequences' | 'verification';

const SECTION_HEADINGS: { key: AdrSectionKey; pattern: RegExp }[] = [
	{ key: 'context', pattern: /^##\s+Context\b/im },
	{ key: 'decision', pattern: /^##\s+Decision\b/im },
	{ key: 'consequences', pattern: /^##\s+Consequences\b/im },
	{ key: 'verification', pattern: /^##\s+Verification(?:\s+anchors)?\b/im },
];

function stripFrontmatter(raw: string): string {
	if (!raw.startsWith('---')) return raw;
	const end = raw.indexOf('\n---', 3);
	if (end === -1) return raw;
	return raw.slice(end + 4);
}

/** Extract ADR body sections for expandable reader UI (markdown/plain text). */
export function parseAdrSections(raw: string): Partial<Record<AdrSectionKey, string>> {
	const body = stripFrontmatter(raw);
	const matches: { key: AdrSectionKey; index: number }[] = [];
	for (const { key, pattern } of SECTION_HEADINGS) {
		const match = pattern.exec(body);
		if (match?.index != null) matches.push({ key, index: match.index });
	}
	if (!matches.length) return {};
	matches.sort((a, b) => a.index - b.index);

	const sections: Partial<Record<AdrSectionKey, string>> = {};
	for (let i = 0; i < matches.length; i += 1) {
		const current = matches[i]!;
		const next = matches[i + 1];
		const chunk = body.slice(current.index, next?.index ?? body.length);
		const firstLineEnd = chunk.indexOf('\n');
		const content = (firstLineEnd === -1 ? '' : chunk.slice(firstLineEnd + 1)).trim();
		if (content) sections[current.key] = content;
	}
	return sections;
}
