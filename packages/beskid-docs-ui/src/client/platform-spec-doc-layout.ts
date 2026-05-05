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
			target.appendChild(cursor);
			cursor = next;
		}
		layout.dataset.platformSpecDocMounted = 'true';
	}
}

mountPlatformSpecDocSplit();
