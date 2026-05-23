/**
 * Guard book reading layout against Starlight TwoColumnContent regressions.
 * Fails if book.css drops grid/width overrides (main 1fr, TOC fits content, Starlight sl-container fix).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const bookCssPath = path.resolve(__dirname, '../../beskid-docs-ui/src/styles/book.css');

const REQUIRED = [
	'STARLIGHT_BOOK_LAYOUT_GUARD',
	'grid-template-columns: minmax(0, 1fr)',
	'max-content',
	'html[data-book][data-has-toc] .right-sidebar-panel .sl-container',
	'width: 100% !important',
	'max-width: none !important',
	'html[data-book][data-has-toc] .main-pane',
	'width: 100% !important',
	'html[data-book][data-has-toc] .book-reader',
	'max-width: 100%',
	'--book-toc-min',
	'--book-toc-max',
];

const FORBIDDEN = [
	/* Centering main-pane caused a dead band between prose and the outline */
	'justify-content: center',
];

function main() {
	if (!fs.existsSync(bookCssPath)) {
		console.error(`verify-book-layout: missing ${bookCssPath}`);
		process.exit(1);
	}
	const css = fs.readFileSync(bookCssPath, 'utf8');
	const errors = [];

	for (const needle of REQUIRED) {
		if (!css.includes(needle)) {
			errors.push(`book.css must include: ${needle}`);
		}
	}
	for (const needle of FORBIDDEN) {
		if (css.includes(needle)) {
			errors.push(`book.css must not include (layout regression): ${needle}`);
		}
	}

	if (errors.length) {
		console.error('verify-book-layout failed:\n');
		for (const e of errors) console.error(`  - ${e}`);
		process.exit(1);
	}

	console.log('verify-book-layout: OK (book.css Starlight two-column guards present).');
}

main();
