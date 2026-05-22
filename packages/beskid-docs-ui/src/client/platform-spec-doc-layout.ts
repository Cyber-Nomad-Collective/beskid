function mountPlatformSpecDocSplit() {
	const layouts = document.querySelectorAll<HTMLElement>('[data-platform-spec-doc-split]');
	for (const layout of layouts) {
		if (layout.dataset.platformSpecDocMounted === 'true') continue;
		const target = layout.querySelector<HTMLElement>('[data-platform-spec-doc-content-target]');
		const parent = layout.parentElement;
		if (!target || !parent) continue;
		let cursor = layout.nextSibling;
		while (cursor) {
			const next = cursor.nextSibling;
			// Leave scripts in place so tab panel moves do not reorder executed modules.
			if (cursor instanceof HTMLScriptElement) {
				cursor = next;
				continue;
			}
			target.appendChild(cursor);
			cursor = next;
		}
		layout.dataset.platformSpecDocMounted = 'true';
	}
}

function initPlatformSpecDocSplit() {
	mountPlatformSpecDocSplit();
	// Content must be in the first panel before we force Current document on article pages.
	import('./platform-spec-doc-tabs.ts').then((m) => m.selectCurrentDocumentTab());
}

initPlatformSpecDocSplit();
document.addEventListener('astro:after-swap', initPlatformSpecDocSplit);
