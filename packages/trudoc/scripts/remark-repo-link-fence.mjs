/**
 * Fenced blocks with language `repo` render a static GitHub link card (Markdown / MDX).
 *
 * ```repo
 * path: compiler/crates/foo/lib.rs
 * label: View in repo
 * kind: blob
 * ref: main
 * ```
 *
 * `path` is required (can be first bare line). `kind` is `blob` or `tree` (default `blob`).
 */

function escapeHtml(value) {
	return String(value)
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}

function githubWebUrl(repo, kind, ref, repoPath) {
	const clean = repoPath.replace(/^\/+/, '').replace(/\\/g, '/');
	const encoded = clean
		.split('/')
		.map((seg) => encodeURIComponent(seg))
		.join('/');
	const kindSeg = kind === 'tree' ? 'tree' : 'blob';
	return `https://github.com/${repo}/${kindSeg}/${ref}/${encoded}`;
}

function parseRepoFence(source) {
	const out = { path: '', label: '', kind: 'blob', ref: 'main' };
	const lines = String(source ?? '')
		.split(/\r?\n/)
		.map((l) => l.trim())
		.filter((l) => l.length > 0);
	for (const line of lines) {
		const kv = line.match(/^(\w+):\s*(.*)$/);
		if (kv) {
			const k = kv[1].toLowerCase();
			const v = kv[2].trim();
			if (k === 'path') out.path = v;
			else if (k === 'label') out.label = v;
			else if (k === 'kind') out.kind = v.toLowerCase() === 'tree' ? 'tree' : 'blob';
			else if (k === 'ref') out.ref = v;
			continue;
		}
		if (!out.path) out.path = line;
	}
	return out;
}

function renderRepoCard(parsed, repo) {
	const href = githubWebUrl(repo, parsed.kind, parsed.ref, parsed.path);
	const label = parsed.label || parsed.path || 'Repository';
	return [
		`<aside class="platform-spec-repo-fence-card">`,
		`<p class="platform-spec-repo-fence-card__path"><code>${escapeHtml(parsed.path)}</code></p>`,
		`<p class="platform-spec-repo-fence-card__link"><a href="${escapeHtml(href)}" rel="noopener noreferrer" target="_blank">${escapeHtml(label)}</a></p>`,
		`</aside>`,
	].join('');
}

export function remarkRepoLinkFence(options = {}) {
	const repo = options.repo || 'Cyber-Nomad-Collective/beskid';
	return (tree, file) => {
		let sequence = 0;
		const walk = (node) => {
			if (!node || !Array.isArray(node.children)) return;
			const nextChildren = [];
			for (const child of node.children) {
				const lang = typeof child.lang === 'string' ? child.lang.trim().toLowerCase() : '';
				if (child.type === 'code' && lang === 'repo') {
					sequence += 1;
					const source = String(child.value ?? '');
					const parsed = parseRepoFence(source);
					if (!parsed.path.trim()) {
						file.message('repo fence: missing path (set `path:` or a first-line path).');
						nextChildren.push(child);
						continue;
					}
					nextChildren.push({
						type: 'html',
						value: renderRepoCard(parsed, repo),
					});
					continue;
				}
				walk(child);
				nextChildren.push(child);
			}
			node.children = nextChildren;
		};
		walk(tree);
	};
}
