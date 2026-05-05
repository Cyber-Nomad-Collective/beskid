/**
 * Single source for "related spec / related topics" list markup (SSR + graph client).
 * Keep class names aligned with `RelatedTopics.astro` and `.related-topics` in platform-spec.css.
 */

export type RelatedTopicSeverity = 'informational' | 'low' | 'medium' | 'high' | 'critical';

export type RelatedTopicPayload = {
	type: 'Domain' | 'Area' | 'Feature';
	title: string;
	href: string;
	relation?: string;
	blocker?: boolean;
	severity?: RelatedTopicSeverity;
};

export function escapeHtml(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const typeClass: Record<RelatedTopicPayload['type'], string> = {
	Domain: 'related-topics__type--domain',
	Area: 'related-topics__type--area',
	Feature: 'related-topics__type--feature',
};

const severityClass: Record<RelatedTopicSeverity, string> = {
	informational: 'related-topics__severity--informational',
	low: 'related-topics__severity--low',
	medium: 'related-topics__severity--medium',
	high: 'related-topics__severity--high',
	critical: 'related-topics__severity--critical',
};

export type RenderRelatedTopicsOptions = {
	heading?: string;
	headingId?: string;
	/** Extra classes on the root `<section>` (e.g. compact panel variant). */
	rootClass?: string;
	emptyMessage?: string;
};

export function renderRelatedTopicsSection(
	topics: RelatedTopicPayload[],
	options: RenderRelatedTopicsOptions = {},
): string {
	const heading = options.heading ?? 'Related topics';
	const headingId = options.headingId ?? 'related-topics-heading';
	const rootClass = ['related-topics', options.rootClass].filter(Boolean).join(' ');

	if (!topics.length) {
		const msg = escapeHtml(options.emptyMessage ?? 'No related spec documents declared.');
		return `<section class="${escapeHtml(rootClass)}" aria-label="${escapeHtml(heading)}"><p class="related-topics__empty">${msg}</p></section>`;
	}

	const items = topics.map((t) => {
		const itemClass = ['related-topics__item', t.blocker ? 'related-topics__item--blocker' : '']
			.filter(Boolean)
			.join(' ');
		const typeSpan = `<span class="related-topics__type ${typeClass[t.type]}">${escapeHtml(t.type)}</span>`;
		const sev =
			t.severity != null
				? `<span class="related-topics__severity ${severityClass[t.severity]}" title="Relation seriousness">${escapeHtml(t.severity)}</span>`
				: '';
		const blocker = t.blocker ? `<span class="related-topics__blocker">Blocker</span>` : '';
		const row = `<div class="related-topics__row">${typeSpan}${sev}${blocker}</div>`;
		const rel = t.relation?.trim()
			? `<p class="related-topics__relation">${escapeHtml(t.relation.trim())}</p>`
			: '';
		return `<li class="${escapeHtml(itemClass)}">${row}<a class="related-topics__title" href="${escapeHtml(t.href)}">${escapeHtml(
			t.title,
		)}</a>${rel}</li>`;
	});

	return `<section class="${escapeHtml(rootClass)}" aria-labelledby="${escapeHtml(headingId)}"><h2 id="${escapeHtml(headingId)}" class="related-topics__heading">${escapeHtml(heading)}</h2><ul class="related-topics__list">${items.join('')}</ul></section>`;
}
