import { initBeskidHub } from "../client/beskid-hub";
import {
	BESKID_SERVICES,
	type BeskidService,
} from "../data/beskid-services";
import { renderHubRootHtml } from "../hub/hub-root-html";

export const BESKID_HUB_TAG = "beskid-hub";

let hubInstanceCounter = 0;

function nextDialogId(): string {
	hubInstanceCounter += 1;
	return `beskid-hub-dialog-${hubInstanceCounter}`;
}

function parseServicesAttribute(raw: string | null): BeskidService[] {
	if (!raw?.trim()) return BESKID_SERVICES;
	try {
		const parsed = JSON.parse(raw) as BeskidService[];
		return Array.isArray(parsed) && parsed.length > 0 ? parsed : BESKID_SERVICES;
	} catch {
		return BESKID_SERVICES;
	}
}

/** Light-DOM custom element for the Beskid services hub (no React). */
export class BeskidHubElement extends HTMLElement {
	static readonly observedAttributes = ["services", "class"];

	#dialogId = nextDialogId();
	#mounted = false;

	connectedCallback() {
		this.mount();
	}

	attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
		if (!this.#mounted || oldValue === newValue) return;
		if (name === "services" || name === "class") {
			this.mount();
		}
	}

	private mount() {
		const services = parseServicesAttribute(this.getAttribute("services"));
		const className = this.getAttribute("class") ?? undefined;

		this.innerHTML = renderHubRootHtml({
			dialogId: this.#dialogId,
			services,
			className,
		});

		initBeskidHub(this);
		this.#mounted = true;
	}
}

export function registerBeskidHubElement(tag = BESKID_HUB_TAG) {
	if (typeof customElements === "undefined") return;
	if (customElements.get(tag)) return;
	customElements.define(tag, BeskidHubElement);
}
