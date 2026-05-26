// src/hub/icons.ts
var SVG_ATTRS = 'xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
var PATHS = {
  home: '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  "platform-spec": '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
  book: '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
  pckg: '<path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12"/><path d="m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7"/><path d="m7.5 4.27 9 5.15"/>',
  roadmap: '<path d="M6 5v11"/><path d="M12 5v6"/><path d="M18 5v14"/><path d="M6 16h12"/>'
};
function hubIconSvg(icon) {
  return `<svg class="beskid-hub__tile-icon" ${SVG_ATTRS}>${PATHS[icon]}</svg>`;
}

// src/client/beskid-hub.ts
var HUB_ROOT_SELECTOR = "[data-beskid-hub-root]";
var HUB_SELECTOR = "[data-beskid-hub]";
var TRIGGER_SELECTOR = "[data-beskid-hub-trigger]";
var CLOSE_SELECTOR = "[data-beskid-hub-close]";
var documentListenersAttached = false;
function parseServices(root) {
  const raw = root.getAttribute("data-services");
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}
function escapeHtml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}
function tileHtml(service) {
  return `
		<a class="beskid-hub__tile" href="${escapeHtml(service.href)}">
			${hubIconSvg(service.icon)}
			<span class="beskid-hub__tile-label">${escapeHtml(service.label)}</span>
		</a>
	`;
}
function renderGrid(dialog, services) {
  const grid = dialog.querySelector("[data-beskid-hub-grid]");
  if (!grid) return;
  grid.innerHTML = services.map(tileHtml).join("");
}
function hubDialogForRoot(root) {
  return root.querySelector(HUB_SELECTOR);
}
function prepareHubRoot(root) {
  const dialog = hubDialogForRoot(root);
  if (!dialog) return null;
  renderGrid(dialog, parseServices(root));
  return dialog;
}
function openHub(dialog) {
  if (!dialog.open) {
    dialog.showModal();
    dialog.querySelector(CLOSE_SELECTOR)?.focus();
  }
}
function closeHub(dialog) {
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
      const root = trigger.closest(HUB_ROOT_SELECTOR);
      if (!root) return;
      const dialog = prepareHubRoot(root);
      if (dialog) openHub(dialog);
      return;
    }
    const closeBtn = target.closest(CLOSE_SELECTOR);
    if (closeBtn) {
      const dialog = closeBtn.closest(HUB_SELECTOR);
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
    true
  );
}
function initBeskidHub(scope = document) {
  attachDocumentListeners();
  scope.querySelectorAll(HUB_ROOT_SELECTOR).forEach(prepareHubRoot);
}
function initBeskidHubAfterBlazor() {
  if (typeof window === "undefined") return;
  const blazor = window.Blazor;
  if (!blazor?.addEventListener) return;
  blazor.addEventListener("enhancedload", () => initBeskidHub());
}

// src/client/beskid-hub-entry.ts
initBeskidHub();
initBeskidHubAfterBlazor();
