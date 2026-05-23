import type { PlatformSpecSearchItem } from '../platform-spec/platformSpecHomeData';
import { onPageNavigation } from './view-transition-lifecycle';

const LEVEL_ORDER = ['domain', 'area', 'feature', 'article', 'adr', 'root', 'hub'];

function readSearchIndex(): PlatformSpecSearchItem[] {
	const el = document.getElementById('platform-spec-home-search-data');
	if (!el?.textContent?.trim()) return [];
	try {
		return JSON.parse(el.textContent) as PlatformSpecSearchItem[];
	} catch {
		console.warn('[platform-spec-home-search] Invalid search index JSON');
		return [];
	}
}

function normalizeQuery(q: string): string {
	return q.trim().toLowerCase();
}

function scoreItem(item: PlatformSpecSearchItem, q: string): number {
	const title = item.title.toLowerCase();
	const sub = item.subtitle.toLowerCase();
	const href = item.href.toLowerCase();
	if (title === q) return 100;
	if (title.startsWith(q)) return 80;
	if (title.includes(q)) return 60;
	if (sub.includes(q)) return 40;
	if (href.includes(q)) return 30;
	return 0;
}

function groupByLevel(items: PlatformSpecSearchItem[]): Map<string, PlatformSpecSearchItem[]> {
	const map = new Map<string, PlatformSpecSearchItem[]>();
	for (const item of items) {
		const key = item.level;
		const list = map.get(key) ?? [];
		list.push(item);
		map.set(key, list);
	}
	return map;
}

function levelHeading(level: string): string {
	switch (level) {
		case 'domain':
			return 'Domains';
		case 'area':
			return 'Areas';
		case 'feature':
			return 'Features';
		case 'article':
			return 'Articles';
		default:
			return level.charAt(0).toUpperCase() + level.slice(1);
	}
}

function escapeHtml(s: string): string {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

function renderResults(items: PlatformSpecSearchItem[], q: string): string {
	if (!q) {
		return '<p class="platform-spec-home-search__hint">Search domains, areas, features, and articles across the specification.</p>';
	}
	if (!items.length) {
		return '<p class="platform-spec-home-search__empty">No pages match your search.</p>';
	}
	const grouped = groupByLevel(items);
	const levels = [...grouped.keys()].sort(
		(a, b) => (LEVEL_ORDER.indexOf(a) === -1 ? 99 : LEVEL_ORDER.indexOf(a)) - (LEVEL_ORDER.indexOf(b) === -1 ? 99 : LEVEL_ORDER.indexOf(b)),
	);
	const sections = levels.map((level) => {
		const rows = grouped.get(level) ?? [];
		const lis = rows
			.map(
				(item) =>
					`<li><a class="platform-spec-home-search__item" href="${escapeHtml(item.href)}"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.subtitle)} · ${escapeHtml(item.level)}</span></a></li>`,
			)
			.join('');
		return `<section class="platform-spec-home-search__group"><h3 class="platform-spec-home-search__group-title">${escapeHtml(levelHeading(level))}</h3><ul class="platform-spec-home-search__group-list">${lis}</ul></section>`;
	});
	return sections.join('');
}

function initPlatformSpecHomeSearch(): void {
	const root = document.querySelector<HTMLElement>('[data-platform-spec-home-search]');
	if (!root) return;
	const input = root.querySelector<HTMLInputElement>('.platform-spec-home-search__input');
	const panel = root.querySelector<HTMLElement>('.platform-spec-home-search__panel');
	const results = root.querySelector<HTMLElement>('.platform-spec-home-search__results');
	const clearBtn = root.querySelector<HTMLButtonElement>('.platform-spec-home-search__clear');
	if (!input || !results || !panel) return;

	const index = readSearchIndex();

	const update = () => {
		const q = normalizeQuery(input.value);
		if (clearBtn) clearBtn.hidden = q.length === 0;
		const matches =
			q.length === 0
				? []
				: index
						.map((item) => ({ item, score: scoreItem(item, q) }))
						.filter((x) => x.score > 0)
						.sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title))
						.slice(0, 24)
						.map((x) => x.item);
		results.innerHTML = renderResults(matches, q);
		const showPanel = document.activeElement === input || q.length > 0;
		panel.hidden = !showPanel;
	};

	input.addEventListener('input', update);
	input.addEventListener('focus', () => {
		panel.hidden = false;
		update();
	});

	clearBtn?.addEventListener('click', () => {
		input.value = '';
		input.focus();
		update();
	});

	document.addEventListener('click', (e) => {
		if (!root.contains(e.target as Node)) {
			if (!input.value.trim()) panel.hidden = true;
		}
	});

	update();
}

onPageNavigation(() => initPlatformSpecHomeSearch());
