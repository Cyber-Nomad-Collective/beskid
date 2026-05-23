/**
 * Guard platform-spec home Browse layout against Starlight main-pane width regressions.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cssPath = path.resolve(__dirname, '../../beskid-docs-ui/src/styles/platform-spec-map-and-shell.css');

const REQUIRED = [
	'STARLIGHT_PLATFORM_SPEC_HOME_LAYOUT_GUARD',
	"data-active-tab='browse'",
	'max-width: min(88rem, 100%)',
	'margin-inline: auto',
	'--sl-content-margin-inline: 0',
	"data-active-tab='map'",
];

function main() {
	if (!fs.existsSync(cssPath)) {
		console.error(`verify-platform-spec-home-layout: missing ${cssPath}`);
		process.exit(1);
	}
	const css = fs.readFileSync(cssPath, 'utf8');
	const errors = [];

	for (const needle of REQUIRED) {
		if (!css.includes(needle)) {
			errors.push(`platform-spec-map-and-shell.css must include: ${needle}`);
		}
	}

	if (css.includes('mapIndexHtmlRel')) {
		errors.push('platform-spec-map-and-shell.css must not reference mapIndexHtmlRel');
	}

	if (errors.length) {
		console.error('verify-platform-spec-home-layout failed:\n');
		for (const e of errors) console.error(`  - ${e}`);
		process.exit(1);
	}

	console.log('verify-platform-spec-home-layout: OK (platform-spec home Starlight layout guards present).');
}

main();
