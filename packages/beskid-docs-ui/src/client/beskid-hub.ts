/** Fullscreen Beskid services hub (`<dialog class="beskid-hub">`). */

import type { BeskidService } from "../data/beskid-services";
import { hubIconSvg } from "../hub/icons";

const HUB_ROOT_SELECTOR = "[data-beskid-hub-root]";
const HUB_SELECTOR = "[data-beskid-hub]";
const TRIGGER_SELECTOR = "[data-beskid-hub-trigger]";
const CLOSE_SELECTOR = "[data-beskid-hub-close]";

let documentListenersAttached = false;

function parseServices(root: HTMLElement): BeskidService[] {
	const raw = root.getAttribute("data-services");
	if (!raw) return [];
	try {
		return JSON.parse(raw) as BeskidService[];
	} catch {
		return [];
	}
}

function escapeHtml(value: string): string {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;");
}

function tileHtml(service: BeskidService): string {
	return `
		<a class="beskid-hub__tile" href="${escapeHtml(service.href)}">
			${hubIconSvg(service.icon)}
			<span class="beskid-hub__tile-label">${escapeHtml(service.label)}</span>
		</a>
	`;
}

function renderGrid(dialog: HTMLDialogElement, services: BeskidService[]) {
	const grid = dialog.querySelector<HTMLElement>("[data-beskid-hub-grid]");
	if (!grid) return;
	grid.innerHTML = services.map(tileHtml).join("");
}

function hubDialogForRoot(root: HTMLElement): HTMLDialogElement | null {
	return root.querySelector<HTMLDialogElement>(HUB_SELECTOR);
}

function prepareHubRoot(root: HTMLElement): HTMLDialogElement | null {
	const dialog = hubDialogForRoot(root);
	if (!dialog) return null;
	renderGrid(dialog, parseServices(root));
	return dialog;
}

function openHub(dialog: HTMLDialogElement) {
	if (!dialog.open) {
		dialog.showModal();
		dialog.querySelector<HTMLButtonElement>(CLOSE_SELECTOR)?.focus();
	}
}

function closeHub(dialog: HTMLDialogElement) {
	if (dialog.open) dialog.close();
}

function attachDocumentListeners() {
	if (documentListenersAttached) return;
	documentListenersAttached = true;

	document.addEventListener("click", (event) => {
		const target = event.target;
		if (!(target instanceof Element)) return;

		const trigger = target.closest(TRIGGER_SELECTOR);
		if (trigger) {
			event.preventDefault();
			const root = trigger.closest<HTMLElement>(HUB_ROOT_SELECTOR);
			if (!root) return;
			const dialog = prepareHubRoot(root);
			if (dialog) openHub(dialog);
			return;
		}

		const closeBtn = target.closest(CLOSE_SELECTOR);
		if (closeBtn) {
			const dialog = closeBtn.closest<HTMLDialogElement>(HUB_SELECTOR);
			if (dialog) closeHub(dialog);
		}
	});

	document.addEventListener("click", (event) => {
		const target = event.target;
		if (target instanceof HTMLDialogElement && target.matches(HUB_SELECTOR)) {
			closeHub(target);
		}
	});

	document.addEventListener(
		"cancel",
		(event) => {
			const dialog = event.target;
			if (dialog instanceof HTMLDialogElement && dialog.matches(HUB_SELECTOR)) {
				event.preventDefault();
				closeHub(dialog);
			}
		},
		true,
	);
}

/** Binds hub behavior for roots in `scope` (delegated clicks survive Blazor DOM swaps). */
export function initBeskidHub(scope: ParentNode = document) {
	attachDocumentListeners();
	scope.querySelectorAll<HTMLElement>(HUB_ROOT_SELECTOR).forEach(prepareHubRoot);
}

declare global {
	interface Window {
		Blazor?: {
			addEventListener?: (eventName: string, callback: () => void) => void;
		};
	}
}

/** Re-prepare hubs after Blazor enhanced navigation replaces layout markup. */
export function initBeskidHubAfterBlazor() {
	if (typeof window === "undefined") return;
	const blazor = window.Blazor;
	if (!blazor?.addEventListener) return;
	blazor.addEventListener("enhancedload", () => initBeskidHub());
}
