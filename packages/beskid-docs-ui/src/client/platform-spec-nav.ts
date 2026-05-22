/** Platform-spec hierarchy rail (desktop) and drawer (mobile). */

import { bindDocAreaNavTopSync, initDocAreaNav } from './doc-area-nav';

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
	});
}

initPlatformSpecNav();
document.addEventListener('astro:after-swap', initPlatformSpecNav);
bindDocAreaNavTopSync();
