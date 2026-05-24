import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Shiki / Expressive Code language registration for Beskid source. */
export function loadBeskidGrammar() {
	return JSON.parse(readFileSync(path.join(__dirname, 'beskid.tmLanguage.json'), 'utf8'));
}
