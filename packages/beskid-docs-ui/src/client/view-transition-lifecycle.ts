/**
 * Shared init/cleanup for Astro ClientRouter navigations.
 */

import { teardownPlatformSpecGraph } from './platform-spec-graph-client';

function cleanupBeforeSwap(): void {
	document.querySelectorAll('[data-doc-area-nav-portaled]').forEach((el) => el.remove());
	document.querySelectorAll('[data-doc-area-nav-mounted]').forEach((el) => {
		el.removeAttribute('data-doc-area-nav-mounted');
	});
	document.querySelectorAll('[data-book-reader]').forEach((el) => {
		el.removeAttribute('data-book-reader-mounted');
	});
	document.querySelectorAll('[data-platform-spec-doc-mounted]').forEach((el) => {
		el.removeAttribute('data-platform-spec-doc-mounted');
	});
	document.querySelectorAll('[data-downloads-page]').forEach((el) => {
		el.removeAttribute('data-downloads-page-bound');
	});
	teardownPlatformSpecGraph();
}

/** Run on first load and after each client navigation swap. */
export function onPageNavigation(init: () => void, cleanup?: () => void): void {
	const runInit = () => init();
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', runInit, { once: true });
	} else {
		runInit();
	}
	document.addEventListener('astro:page-load', runInit);
	document.addEventListener('astro:after-swap', runInit);
	if (cleanup) {
		document.addEventListener('astro:before-swap', cleanup);
	}
}

if (!document.documentElement.dataset.viewTransitionLifecycleBound) {
	document.documentElement.dataset.viewTransitionLifecycleBound = 'true';
	document.addEventListener('astro:before-swap', cleanupBeforeSwap);
}
