const DEFAULT_ORIGIN = "https://spec.beskid-lang.org";

class BeskidDocEmbed extends HTMLElement {
	connectedCallback() {
		if (this.dataset.enhanced === "true") return;
		const kind = this.getAttribute("kind");
		if (kind === "spec") {
			this.dataset.enhanced = "true";
			this.enhanceSpecEmbed();
		} else if (kind === "author-graph") {
			this.dataset.enhanced = "true";
			this.enhanceAuthorGraph();
		} else if (kind === "github-code") {
			this.dataset.enhanced = "true";
			this.enhanceGitHubCode();
		}
	}

	enhanceSpecEmbed() {
		const ref = this.getAttribute("ref");
		if (!ref) return;
		const origin = this.getAttribute("origin") || DEFAULT_ORIGIN;
		const fallback = this.innerHTML;
		this.setAttribute("aria-busy", "true");
		fetch(`${origin}/api/v1/embed/${encodeURIComponent(ref)}`)
			.then((response) => {
				if (!response.ok)
					throw new Error(`embed request failed (${response.status})`);
				return response.json();
			})
			.then((payload) => {
				const article = document.createElement("article");
				article.className = "beskid-doc-embed__content";
				article.innerHTML = payload.html;
				const source = document.createElement("a");
				source.className = "beskid-doc-embed__source";
				source.href = new URL(payload.href, origin).toString();
				source.textContent = `Open in the Beskid standard (${payload.revision})`;
				this.replaceChildren(article, source);
			})
			.catch(() => {
				this.innerHTML = fallback;
			})
			.finally(() => this.removeAttribute("aria-busy"));
	}

	enhanceAuthorGraph() {
		const raw = this.getAttribute("data-graph");
		if (!raw) return;
		try {
			const graph = JSON.parse(decodeURIComponent(raw));
			const placeholder = document.createElement("div");
			placeholder.className = "beskid-doc-embed__graph-placeholder";
			const title = graph.title || "Architecture graph";
			placeholder.innerHTML = `<p class="beskid-doc-embed__graph-title">${escapeHtml(title)}</p><p class="beskid-doc-embed__graph-hint" aria-hidden="true">Loading graph…</p>`;
			this.replaceChildren(placeholder);
		} catch {
			// Leave fallback content; React hydrator will handle valid payloads.
		}
	}

	/**
	 * Progressive enhancement for GitHub source embeds. The directive
	 * renderer already leaves a readable "View on GitHub" link as
	 * fallback content; we keep it visible until the React hydrator
	 * ({@link SpecContent}) fetches and highlights the source. If JS is
	 * disabled or the hydrator never runs, the link fallback remains
	 * usable, so this is a deliberate no-op beyond marking the element
	 * enhanced.
	 */
	enhanceGitHubCode() {
		// No-op: preserve the readable link fallback for progressive
		// enhancement. The React hydrator replaces children on success.
	}
}

function escapeHtml(value) {
	return String(value)
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

if (!customElements.get("beskid-doc-embed")) {
	customElements.define("beskid-doc-embed", BeskidDocEmbed);
}
