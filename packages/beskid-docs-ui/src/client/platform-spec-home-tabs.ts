type SpecHomeTab = 'map' | 'browse';

function selectTab(id: SpecHomeTab, opts?: { replaceHash?: boolean }) {
	const roots = document.querySelectorAll<HTMLElement>('[data-platform-spec-home]');
	const root = roots[0];
	if (!root) return;
	const tabs = root.querySelectorAll<HTMLButtonElement>('.platform-spec-home__tab');
	const panels = root.querySelectorAll<HTMLElement>('[data-tab-panel]');
	const replaceHash = opts?.replaceHash !== false;
	tabs.forEach((btn) => {
		const active = btn.dataset.tab === id;
		btn.setAttribute('aria-selected', String(active));
		btn.tabIndex = active ? 0 : -1;
		btn.classList.toggle('is-active', active);
	});
	panels.forEach((panel) => {
		panel.hidden = panel.dataset.tabPanel !== id;
	});
	if (replaceHash && history.replaceState) {
		const h = id === 'browse' ? '#browse' : '#map';
		const nextUrl = `${location.pathname}${location.search}${h}`;
		if (`${location.pathname}${location.search}${location.hash}` !== nextUrl) {
			history.replaceState(null, '', nextUrl);
		}
	}
}

function initPlatformSpecHomeTabs() {
	const roots = document.querySelectorAll<HTMLElement>('[data-platform-spec-home]');
	if (roots.length > 1) {
		console.warn(
			'[platform-spec-home] Multiple hub roots in the DOM; ensure only one PlatformSpecHome per page or duplicate aria ids will confuse assistive tech.',
			roots.length,
		);
	}
	const root = roots[0];
	if (!root) return;

	const hash = location.hash.replace(/^#/, '');
	const initial: SpecHomeTab = hash === 'browse' ? 'browse' : 'map';
	selectTab(initial, { replaceHash: false });
	if (!location.hash && history.replaceState) {
		history.replaceState(null, '', `${location.pathname}${location.search}#map`);
	}

	root.querySelectorAll<HTMLButtonElement>('.platform-spec-home__tab').forEach((btn) => {
		btn.addEventListener('click', () => selectTab(btn.dataset.tab === 'browse' ? 'browse' : 'map'));
	});

	window.addEventListener('hashchange', () => {
		const h = location.hash.replace(/^#/, '');
		selectTab(h === 'browse' ? 'browse' : 'map', { replaceHash: false });
	});

	root.addEventListener('keydown', (e) => {
		if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
		const active = root.querySelector<HTMLButtonElement>('.platform-spec-home__tab[aria-selected="true"]');
		if (!active) return;
		if (e.key === 'ArrowRight' && active.dataset.tab === 'map') {
			e.preventDefault();
			selectTab('browse');
		}
		if (e.key === 'ArrowLeft' && active.dataset.tab === 'browse') {
			e.preventDefault();
			selectTab('map');
		}
	});
}

initPlatformSpecHomeTabs();
