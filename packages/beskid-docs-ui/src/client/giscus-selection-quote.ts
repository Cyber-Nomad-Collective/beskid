/**
 * Lets readers select prose in the main column and copy a Markdown quote + page URL
 * for pasting into the giscus box (one thread per page; giscus has no native range comments).
 */
function isInsideMainContent(node: Node | null): boolean {
	if (!node) return false;
	const root =
		document.querySelector<HTMLElement>('main .sl-markdown-content') ??
		document.querySelector<HTMLElement>('main [data-platform-spec]') ??
		document.querySelector<HTMLElement>('main');
	if (!root) return false;
	const el = node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as Element);
	return !!(el && root.contains(el));
}

function pageUrlWithNearestHash(range: Range): string {
	let node: Node | null = range.commonAncestorContainer;
	if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
	let el = node as Element | null;
	while (el && el !== document.body) {
		if (el.id && /^[A-Za-z][\w:.-]*$/.test(el.id)) {
			return `${location.origin}${location.pathname}#${el.id}`;
		}
		el = el.parentElement;
	}
	return `${location.origin}${location.pathname}${location.search}`;
}

function stripForQuote(s: string): string {
	return s.replace(/\s+/g, ' ').trim();
}

function hidePopover(pop: HTMLElement): void {
	pop.hidden = true;
	pop.innerHTML = '';
}

function showPopover(pop: HTMLElement, range: Range, text: string): void {
	const rect = range.getBoundingClientRect();
	const top = Math.min(window.innerHeight - 48, Math.max(8, rect.bottom + 8));
	const left = Math.min(window.innerWidth - 200, Math.max(8, rect.left));
	pop.style.position = 'fixed';
	pop.style.top = `${top}px`;
	pop.style.left = `${left}px`;

	const url = pageUrlWithNearestHash(range);
	const body = `> ${text.replace(/\n/g, '\n> ')}\n\n— ${url}`;

	pop.innerHTML = '';
	const btn = document.createElement('button');
	btn.type = 'button';
	btn.className = 'giscus-quote-btn';
	btn.textContent = 'Copy quote for discussion';
	btn.title = 'Copies Markdown quote and link; paste into the comment box below';
	btn.addEventListener('click', async () => {
		try {
			await navigator.clipboard.writeText(body);
			btn.textContent = 'Copied';
			setTimeout(() => {
				btn.textContent = 'Copy quote for discussion';
			}, 1600);
		} catch {
			btn.textContent = 'Copy failed';
		}
		const wrap = document.querySelector('.giscus-wrap');
		wrap?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	});

	pop.appendChild(btn);
	pop.hidden = false;
}

function init(): void {
	if (!document.querySelector('.giscus-wrap')) return;

	const pop = document.createElement('div');
	pop.className = 'giscus-quote-popover';
	pop.setAttribute('role', 'status');
	pop.hidden = true;
	document.body.appendChild(pop);

	const style = document.createElement('style');
	style.textContent = `
		.giscus-quote-popover {
			position: absolute;
			z-index: 50;
			padding: 0;
		}
		.giscus-quote-btn {
			font: inherit;
			font-size: var(--sl-text-xs, 0.75rem);
			padding: 0.35rem 0.6rem;
			border-radius: 0.35rem;
			border: 1px solid var(--sl-color-hairline-light, #ccc);
			background: var(--sl-color-bg-nav, #1a1a1a);
			color: var(--sl-color-white, #fff);
			cursor: pointer;
			box-shadow: 0 2px 8px rgba(0,0,0,0.2);
		}
		.giscus-quote-btn:hover {
			filter: brightness(1.08);
		}
	`;
	document.head.appendChild(style);

	document.addEventListener(
		'mouseup',
		() => {
			const sel = window.getSelection();
			if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
				hidePopover(pop);
				return;
			}
			const range = sel.getRangeAt(0);
			if (!isInsideMainContent(range.commonAncestorContainer)) {
				hidePopover(pop);
				return;
			}
			const raw = sel.toString();
			const text = stripForQuote(raw);
			if (text.length < 12) {
				hidePopover(pop);
				return;
			}
			showPopover(pop, range, text);
		},
		true,
	);

	document.addEventListener('mousedown', (e) => {
		if (e.target instanceof Node && pop.contains(e.target)) return;
		// Defer hide so button click still fires
		requestAnimationFrame(() => {
			const sel = window.getSelection();
			if (!sel?.toString().trim()) hidePopover(pop);
		});
	});

	document.addEventListener('scroll', () => hidePopover(pop), true);
}

if (typeof document !== 'undefined') {
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
}
