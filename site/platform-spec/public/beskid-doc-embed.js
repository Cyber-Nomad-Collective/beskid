const DEFAULT_ORIGIN = "https://spec.beskid-lang.org";

class BeskidDocEmbed extends HTMLElement {
	connectedCallback() {
		if (this.dataset.enhanced === "true" || this.getAttribute("kind") !== "spec")
			return;
		this.dataset.enhanced = "true";
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
}

if (!customElements.get("beskid-doc-embed")) {
	customElements.define("beskid-doc-embed", BeskidDocEmbed);
}
