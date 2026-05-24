import { bindDocAreaNavTopSync, initDocAreaNav } from './doc-area-nav';
import { onPageNavigation } from './view-transition-lifecycle';

function initBookNav() {
	initDocAreaNav({
		chromeSelector: '[data-book-nav-chrome]',
		railSelector: '[data-book-nav-rail]',
		backdropSelector: '[data-book-nav-backdrop]',
		mobileToggleSelector: '[data-book-nav-mobile-toggle]',
		closeSelector: '[data-book-nav-close]',
		filterSelector: '[data-book-nav-filter]',
		treeItemSelector: '.platform-spec-nav-tree__item',
		treeLinkSelector: '.platform-spec-nav-tree__link',
		defaultCollapsed: true,
	});
}

onPageNavigation(initBookNav);
bindDocAreaNavTopSync();
