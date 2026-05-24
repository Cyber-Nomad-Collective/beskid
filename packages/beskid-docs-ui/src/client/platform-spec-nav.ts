/** Platform-spec hierarchy rail (desktop) and drawer (mobile). */

import {
	bindDocAreaNavTopSync,
	initDocAreaNav,
	persistRailCollapsed,
} from './doc-area-nav';
import { onPageNavigation } from './view-transition-lifecycle';

function collapsePlatformSpecNavRail() {
	const chrome = document.querySelector<HTMLElement>('[data-platform-spec-nav-chrome]');
	const rail = document.querySelector<HTMLElement>('[data-platform-spec-nav-rail]');
	if (!chrome || !rail) return;
	chrome.setAttribute('data-rail-collapsed', 'true');
	rail.setAttribute('data-rail-collapsed', 'true');
	persistRailCollapsed(true);
	document.body.removeAttribute('data-spec-nav-open');
}

function initPlatformSpecNav() {
	initDocAreaNav({
		chromeSelector: '[data-platform-spec-nav-chrome]',
		railSelector: '[data-platform-spec-nav-rail]',
		backdropSelector: '[data-platform-spec-nav-backdrop]',
		mobileToggleSelector: '[data-platform-spec-nav-mobile-toggle]',
		closeSelector: '[data-platform-spec-nav-close]',
		filterSelector: '[data-platform-spec-nav-filter]',
		treeItemSelector: '.platform-spec-nav-tree__item',
		treeLinkSelector: '.platform-spec-nav-tree__link',
		defaultCollapsed: true,
	});
}

export { collapsePlatformSpecNavRail };

onPageNavigation(initPlatformSpecNav);
bindDocAreaNavTopSync();
