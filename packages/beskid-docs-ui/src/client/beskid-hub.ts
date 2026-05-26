/** Fullscreen Beskid services hub (`<dialog class="beskid-hub">`). */

import type { BeskidService } from "../data/beskid-services";
import { hubIconSvg } from "../hub/icons";

const HUB_SELECTOR = "[data-beskid-hub]";
const TRIGGER_SELECTOR = "[data-beskid-hub-trigger]";

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

function openHub(dialog: HTMLDialogElement) {
	if (!dialog.open) {
		dialog.showModal();
		const close = dialog.querySelector<HTMLButtonElement>("[data-beskid-hub-close]");
		close?.focus();
	}
}

function closeHub(dialog: HTMLDialogElement) {
	if (dialog.open) dialog.close();
}

function bindHub(root: HTMLElement) {
	const dialog = root.matches(HUB_SELECTOR)
		? (root as HTMLDialogElement)
		: root.querySelector<HTMLDialogElement>(HUB_SELECTOR);
	if (!dialog || dialog.dataset.beskidHubBound === "true") return;

	const services = parseServices(root);
	renderGrid(dialog, services);
	dialog.dataset.beskidHubBound = "true";

	root.querySelectorAll<HTMLElement>(TRIGGER_SELECTOR).forEach((trigger) => {
		trigger.addEventListener("click", (event) => {
			event.preventDefault();
			openHub(dialog);
		});
	});

	dialog.querySelector("[data-beskid-hub-close]")?.addEventListener("click", () => {
		closeHub(dialog);
	});

	dialog.addEventListener("click", (event) => {
		if (event.target === dialog) closeHub(dialog);
	});

	dialog.addEventListener("cancel", (event) => {
		event.preventDefault();
		closeHub(dialog);
	});
}

export function initBeskidHub(scope: ParentNode = document) {
	scope.querySelectorAll<HTMLElement>("[data-beskid-hub-root]").forEach(bindHub);
}
