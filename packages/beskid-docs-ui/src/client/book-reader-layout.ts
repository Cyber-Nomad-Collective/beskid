/** Move Starlight markdown panels into the book reader shell and keep chapter nav at the bottom. */

import { onPageNavigation } from './view-transition-lifecycle';

function mountBookReader() {
	const shell = document.querySelector<HTMLElement>('[data-book-reader]');
	if (!shell || shell.dataset.bookReaderMounted === 'true') return;

	const body = shell.querySelector<HTMLElement>('[data-book-reader-body]');
	const chapterNav = shell.querySelector<HTMLElement>('.book-reader__chapter-nav');
	if (!body) return;

	const main = shell.closest('main');
	if (!main) return;

	const panels = [...main.querySelectorAll<HTMLElement>('.content-panel')].filter((panel) => {
		if (panel.contains(shell)) return false;
		return panel.querySelector('.sl-markdown-content, .sl-markdown');
	});

	for (const panel of panels) {
		body.appendChild(panel);
	}

	if (chapterNav) {
		shell.appendChild(chapterNav);
	}

	shell.dataset.bookReaderMounted = 'true';
}

onPageNavigation(mountBookReader);
