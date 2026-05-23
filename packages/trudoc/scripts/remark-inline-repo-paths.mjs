/**
 * Turn inline `` `repo/relative/path` `` into GitHub links when the value looks like a superrepo path.
 */

function githubWebUrl(repo, kind, ref, repoPath) {
	const clean = repoPath.replace(/^\/+/, '').replace(/\\/g, '/');
	const encoded = clean
		.split('/')
		.map((seg) => encodeURIComponent(seg))
		.join('/');
	const kindSeg = kind === 'tree' ? 'tree' : 'blob';
	return `https://github.com/${repo}/${kindSeg}/${ref}/${encoded}`;
}

const KNOWN_ROOT = /^(\.\/)?(compiler|pckg|site|packages|beskid_vscode|references|ci|\.github|\.cursor|beskid_corelib)(\/|$)/;
const SOURCE_EXT = /\.(rs|toml|mdx?|bd|proj|ts|tsx|mjs|js|json|css|pest|yml|yaml|astro|txt)$/i;
const REPO_SUBPATH = /(?:^|\/)(?:crates|src|tests|scripts|packages|beskid_corelib|beskid_corelib\/)\//;

/** @param {string} value */
export function looksLikeRepoPath(value) {
	const v = String(value ?? '').trim();
	if (!v || v.length > 280 || !v.includes('/')) return false;
	if (/^(https?:|mailto:|#|\/\/)/i.test(v)) return false;
	if (/[\s<>{}|]/.test(v)) return false;
	if (!/^[\w.@+()-]+(?:\/[\w.@+()-]+)*\/?$/.test(v)) return false;
	if (KNOWN_ROOT.test(v)) return true;
	if (SOURCE_EXT.test(v)) return true;
	if (REPO_SUBPATH.test(v)) return true;
	if (v.endsWith('/')) return true;
	return false;
}

/** @param {string} value */
function repoPathKind(value) {
	return value.endsWith('/') ? 'tree' : 'blob';
}

/**
 * @param {import('mdast').Root} tree
 * @param {{ repo?: string; ref?: string }} [options]
 */
export function remarkInlineRepoPaths(options = {}) {
	const repo = options.repo || 'Cyber-Nomad-Collective/beskid';
	const ref = options.ref || 'main';

	return (tree) => {
		const walk = (node) => {
			if (!node || !Array.isArray(node.children)) return;
			const next = [];
			for (const child of node.children) {
				if (child.type === 'inlineCode' && looksLikeRepoPath(child.value)) {
					const path = String(child.value).trim();
					const href = githubWebUrl(repo, repoPathKind(path), ref, path);
					next.push({
						type: 'link',
						url: href,
						children: [{ type: 'inlineCode', value: path }],
					});
					continue;
				}
				walk(child);
				next.push(child);
			}
			node.children = next;
		};
		walk(tree);
	};
}
