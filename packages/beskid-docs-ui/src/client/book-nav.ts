import { bindDocAreaNavTopSync, initDocAreaNav } from './doc-area-nav';

function initBookNav() {
	initDocAreaNav({
		chromeSelector: '[data-book-nav-chrome]',
		railSelector: '[data-book-nav-rail]',
		backdropSelector: '[data-book-nav-backdrop]',
		mobileToggleSelector: '[data-book-nav-mobile-toggle]',
		closeSelector: '[data-book-nav-close]',
		filterSelector: '[data-book-nav-filter]',
		treeItemSelector: '.doc-area-nav-tree__item',
		treeLinkSelector: '.doc-area-nav-tree__link',
	});
}

initBookNav();
document.addEventListener('astro:after-swap', initBookNav);
bindDocAreaNavTopSync();
