/** Reliable navigation for spec reader article/tile links; article pages default to Current document tab. */

import { onPageNavigation } from './view-transition-lifecycle';

const ARTICLE_LINK_SELECTOR = 'a.platform-spec-doc-split__article-link';
const TILE_LINK_SELECTOR = 'a.platform-spec-tile';
const CURRENT_DOCUMENT_TAB = 'Current document';
const SYNC_KEY = 'platform-spec-reader';

function isLinkInVisibleTabPanel(link: HTMLAnchorElement): boolean {
	const panel = link.closest<HTMLElement>('[role="tabpanel"]');
	return panel != null && !panel.hasAttribute('hidden');
}

function handleSpecReaderLinkClick(event: MouseEvent) {
	if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
		return;
	}
	const target = event.target;
	if (!(target instanceof Element)) return;

	const link = target.closest<HTMLAnchorElement>(`${ARTICLE_LINK_SELECTOR}, ${TILE_LINK_SELECTOR}`);
	if (!link || link.closest('[role="tablist"]') || !isLinkInVisibleTabPanel(link)) return;

	const href = link.getAttribute('href');
	if (!href || href.startsWith('#')) return;

	event.preventDefault();
	event.stopPropagation();
	window.location.assign(link.href);
}

/** Select the first tab panel (Current document) on article pages. */
export function selectCurrentDocumentTab(root: ParentNode = document) {
	for (const layout of root.querySelectorAll<HTMLElement>(
		'[data-platform-spec-doc-split][data-default-tab="current-document"]',
	)) {
		const tabs = layout.querySelector('starlight-tabs');
		if (!(tabs instanceof HTMLElement)) continue;

		if (typeof localStorage !== 'undefined') {
			localStorage.setItem(`starlight-synced-tabs__${SYNC_KEY}`, CURRENT_DOCUMENT_TAB);
		}

		const tabAnchors = [...tabs.querySelectorAll<HTMLAnchorElement>('[role="tab"]')];
		const index = tabAnchors.findIndex((tab) => tab.textContent?.trim() === CURRENT_DOCUMENT_TAB);
		const activeIndex = index >= 0 ? index : 0;
		const panels = [...tabs.querySelectorAll<HTMLElement>(':scope > [role="tabpanel"]')];
		if (!tabAnchors[activeIndex] || !panels[activeIndex]) continue;

		tabAnchors.forEach((tab, i) => {
			const selected = i === activeIndex;
			tab.setAttribute('aria-selected', selected ? 'true' : 'false');
			tab.setAttribute('tabindex', selected ? '0' : '-1');
		});
		panels.forEach((panel, i) => {
			panel.hidden = i !== activeIndex;
		});
	}
}

function resetSpecReaderPanelScroll(layout: HTMLElement) {
	const main = layout.querySelector<HTMLElement>('.platform-spec-doc-split__main');
	if (!main) return;
	const nodes = [main, ...main.querySelectorAll<HTMLElement>('*')];
	for (const el of nodes) {
		if (el.scrollHeight > el.clientHeight + 1) el.scrollTop = 0;
	}
}

function scrollSpecReaderTabsIntoView(layout: HTMLElement) {
	layout.querySelector('.platform-spec-doc-tabs')?.scrollIntoView({ block: 'start', behavior: 'instant' });
}

function bindSpecReaderTabScrollReset(root: ParentNode = document) {
	for (const layout of root.querySelectorAll<HTMLElement>('[data-platform-spec-doc-split]')) {
		if (layout.dataset.platformSpecTabScrollBound === 'true') continue;
		layout.dataset.platformSpecTabScrollBound = 'true';
		layout.addEventListener('click', (event) => {
			const target = event.target;
			if (!(target instanceof Element)) return;
			if (!target.closest('[role="tablist"]') || !layout.contains(target)) return;
			requestAnimationFrame(() => {
				resetSpecReaderPanelScroll(layout);
				scrollSpecReaderTabsIntoView(layout);
			});
		});
	}
}

function initSpecReaderTabs() {
	selectCurrentDocumentTab();
	bindSpecReaderTabScrollReset();
}

if (!document.documentElement.dataset.platformSpecDocTabsClickBound) {
	document.documentElement.dataset.platformSpecDocTabsClickBound = 'true';
	document.addEventListener('click', handleSpecReaderLinkClick, true);
}

onPageNavigation(initSpecReaderTabs);
