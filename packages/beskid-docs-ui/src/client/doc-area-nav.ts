/** Shared rail + mobile drawer behavior for documentation area nav (platform-spec, book). */

export const OPEN_ATTR = 'data-spec-nav-open';
export const COLLAPSED_ATTR = 'data-rail-collapsed';

export function syncNavRailTopOffset() {
	const topbar = document.querySelector<HTMLElement>('.page > .header');
	if (!topbar) return;
	const topPx = topbar.getBoundingClientRect().bottom;
	document.documentElement.style.setProperty('--platform-spec-panel-top', `${topPx}px`);
}

export function mountRailOnBody(rail: HTMLElement, backdrop: HTMLElement | null) {
	if (rail.dataset.docAreaNavPortaled === 'true') return;
	if (backdrop) {
		document.body.appendChild(backdrop);
		backdrop.dataset.docAreaNavPortaled = 'true';
	}
	document.body.appendChild(rail);
	rail.dataset.docAreaNavPortaled = 'true';
}

export type DocAreaNavOptions = {
	chromeSelector: string;
	railSelector: string;
	backdropSelector: string;
	mobileToggleSelector: string;
	closeSelector: string;
	filterSelector: string;
	treeItemSelector: string;
	treeLinkSelector: string;
	collapsedAttr?: string;
	openAttr?: string;
};

function treeListSelectorFromItemSelector(itemSelector: string): string {
	return itemSelector.replace('__item', '__list');
}

function navItemLabel(item: HTMLElement, linkSelector: string): string {
	const link = item.querySelector<HTMLElement>(
		`:scope > ${linkSelector}, :scope > details > summary ${linkSelector}`,
	);
	return link?.textContent?.trim().toLowerCase() ?? '';
}

function directNavChildItems(
	item: HTMLElement,
	itemSelector: string,
	listSelector: string,
): HTMLElement[] {
	const list = item.querySelector<HTMLElement>(`:scope > details > ${listSelector}`);
	if (!list) return [];
	return [...list.querySelectorAll<HTMLElement>(`:scope > ${itemSelector}`)];
}

function navItemMatchesQuery(
	item: HTMLElement,
	query: string,
	linkSelector: string,
	itemSelector: string,
	listSelector: string,
): boolean {
	if (navItemLabel(item, linkSelector).includes(query)) return true;
	return directNavChildItems(item, itemSelector, listSelector).some((child) =>
		navItemMatchesQuery(child, query, linkSelector, itemSelector, listSelector),
	);
}

function openNavItemAncestors(item: HTMLElement, rail: HTMLElement, itemSelector: string) {
	let parent = item.parentElement?.closest<HTMLElement>(itemSelector);
	while (parent && rail.contains(parent)) {
		const details = parent.querySelector<HTMLDetailsElement>(':scope > details');
		if (details) details.open = true;
		parent = parent.parentElement?.closest<HTMLElement>(itemSelector);
	}
}

function applyNavTreeFilter(
	rail: HTMLElement,
	query: string,
	opts: Pick<DocAreaNavOptions, 'treeItemSelector' | 'treeLinkSelector'>,
) {
	const itemSelector = opts.treeItemSelector;
	const listSelector = treeListSelectorFromItemSelector(itemSelector);
	const items = rail.querySelectorAll<HTMLElement>(itemSelector);
	const q = query.trim().toLowerCase();

	for (const item of items) {
		if (q === '') {
			item.hidden = false;
			continue;
		}
		const visible = navItemMatchesQuery(item, q, opts.treeLinkSelector, itemSelector, listSelector);
		item.hidden = !visible;
		if (visible) openNavItemAncestors(item, rail, itemSelector);
	}
}

export function initDocAreaNav(opts: DocAreaNavOptions) {
	syncNavRailTopOffset();

	const chrome = document.querySelector<HTMLElement>(opts.chromeSelector);
	if (!chrome) return;

	const rail = chrome.querySelector<HTMLElement>(opts.railSelector);
	const backdrop = chrome.querySelector<HTMLElement>(opts.backdropSelector);
	if (!rail) return;

	const navChrome = chrome;
	const navRail = rail;

	const collapsedAttr = opts.collapsedAttr ?? COLLAPSED_ATTR;
	const openAttr = opts.openAttr ?? OPEN_ATTR;

	if (navChrome.dataset.docAreaNavMounted !== 'true') {
		navChrome.dataset.docAreaNavMounted = 'true';
		mountRailOnBody(navRail, backdrop);
	}

	const mobileToggle = document.querySelector<HTMLButtonElement>(opts.mobileToggleSelector);
	const closeBtn = navRail.querySelector<HTMLButtonElement>(opts.closeSelector);
	const filterInput = navRail.querySelector<HTMLInputElement>(opts.filterSelector);

	function setMobileOpen(open: boolean) {
		document.body.toggleAttribute(openAttr, open);
		mobileToggle?.setAttribute('aria-expanded', open ? 'true' : 'false');
		if (backdrop) backdrop.hidden = !open;
		if (open) {
			requestAnimationFrame(() => {
				(
					filterInput && !filterInput.hidden
						? filterInput
						: navRail.querySelector<HTMLAnchorElement>(opts.treeLinkSelector)
				)?.focus();
			});
		} else {
			mobileToggle?.focus();
		}
	}

	function setRailCollapsed(collapsed: boolean) {
		const value = collapsed ? 'true' : 'false';
		navChrome.setAttribute(collapsedAttr, value);
		navRail.setAttribute(collapsedAttr, value);
	}

	if (mobileToggle && mobileToggle.dataset.docAreaNavToggleBound !== 'true') {
		mobileToggle.dataset.docAreaNavToggleBound = 'true';
		mobileToggle.addEventListener('click', () => {
			setMobileOpen(!document.body.hasAttribute(openAttr));
		});
	}

	if (closeBtn && closeBtn.dataset.docAreaNavCloseBound !== 'true') {
		closeBtn.dataset.docAreaNavCloseBound = 'true';
		closeBtn.addEventListener('click', () => setMobileOpen(false));
	}

	if (backdrop && backdrop.dataset.docAreaNavBackdropBound !== 'true') {
		backdrop.dataset.docAreaNavBackdropBound = 'true';
		backdrop.addEventListener('click', () => setMobileOpen(false));
	}

	if (filterInput && filterInput.dataset.docAreaNavFilterBound !== 'true') {
		filterInput.dataset.docAreaNavFilterBound = 'true';
		filterInput.addEventListener('input', () => {
			applyNavTreeFilter(navRail, filterInput.value, opts);
		});
	}

	if (!document.documentElement.dataset.docAreaNavEscapeBound) {
		document.documentElement.dataset.docAreaNavEscapeBound = 'true';
		document.addEventListener('keydown', (e) => {
			if (e.key === 'Escape' && document.body.hasAttribute(openAttr)) {
				setMobileOpen(false);
			}
		});
	}

	const active = navRail.querySelector<HTMLAnchorElement>(`${opts.treeLinkSelector}.is-active`);
	active?.scrollIntoView({ block: 'nearest', inline: 'nearest' });

	setRailCollapsed(false);
	setMobileOpen(false);
}

export function bindDocAreaNavTopSync() {
	if (document.documentElement.dataset.docAreaNavTopSyncBound) return;
	document.documentElement.dataset.docAreaNavTopSyncBound = 'true';
	window.addEventListener('resize', syncNavRailTopOffset);
}
