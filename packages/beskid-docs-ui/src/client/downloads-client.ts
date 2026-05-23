/**
 * Platform-aware install command, direct download link, and platform tabs.
 */

import { onPageNavigation } from './view-transition-lifecycle';

const RELEASE_BASE =
	'https://github.com/Cyber-Nomad-Collective/beskid_compiler/releases/download/cli-latest';

const INSTALL_SH = 'curl -fsSL https://beskid-lang.org/install.sh | bash';
const INSTALL_PS = 'iwr https://beskid-lang.org/install.ps1 -useb | iex';

type PlatformId = 'linux-amd64' | 'darwin-arm64' | 'windows-amd64';

interface PlatformSpec {
	id: PlatformId;
	label: string;
	shortLabel: string;
	asset: string;
	installLabel: string;
	installCommand: string;
	match(): boolean;
}

const PLATFORMS: PlatformSpec[] = [
	{
		id: 'linux-amd64',
		label: 'Linux (x86_64)',
		shortLabel: 'Linux',
		asset: 'beskid-linux-amd64',
		installLabel: 'install.sh',
		installCommand: INSTALL_SH,
		match() {
			const ua = navigator.userAgent;
			return /Linux/i.test(ua) && !/Android/i.test(ua);
		},
	},
	{
		id: 'darwin-arm64',
		label: 'macOS (Apple Silicon)',
		shortLabel: 'macOS',
		asset: 'beskid-darwin-arm64',
		installLabel: 'install.sh',
		installCommand: INSTALL_SH,
		match() {
			const ua = navigator.userAgent;
			if (!/Mac|Macintosh/i.test(ua)) return false;
			if (/Intel Mac OS X|MacIntel/i.test(ua)) return false;
			return true;
		},
	},
	{
		id: 'windows-amd64',
		label: 'Windows (x86_64)',
		shortLabel: 'Windows',
		asset: 'beskid-windows-amd64.exe',
		installLabel: 'install.ps1',
		installCommand: INSTALL_PS,
		match() {
			return /Win/i.test(navigator.userAgent);
		},
	},
];

function detectPlatform(): PlatformSpec | null {
	return PLATFORMS.find((p) => p.match()) ?? null;
}

function directUrl(asset: string): string {
	return `${RELEASE_BASE}/${asset}`;
}

function initDownloadsPage(root: HTMLElement): void {
	if (root.dataset.downloadsPageBound === 'true') return;
	root.dataset.downloadsPageBound = 'true';

	const commandEl = root.querySelector<HTMLElement>('[data-install-command]');
	const commandLabel = root.querySelector<HTMLElement>('[data-command-label]');
	const directBtn = root.querySelector<HTMLAnchorElement>('[data-direct-download]');
	const directLabel = root.querySelector<HTMLElement>('[data-direct-download-label]');
	const copyBtn = root.querySelector<HTMLButtonElement>('[data-copy-install]');
	const copyLabel = copyBtn?.querySelector<HTMLElement>('[data-copy-label]');
	const hintEl = root.querySelector<HTMLElement>('[data-platform-hint]');
	const tabs = root.querySelectorAll<HTMLButtonElement>('[data-install-tab]');

	if (!commandEl || !directBtn) return;

	let active = detectPlatform() ?? PLATFORMS[0];

	const applyPlatform = (platform: PlatformSpec) => {
		active = platform;
		commandEl.textContent = platform.installCommand;
		if (commandLabel) commandLabel.textContent = platform.installLabel;
		directBtn.href = directUrl(platform.asset);
		directBtn.setAttribute('download', platform.asset);
		if (directLabel) {
			directLabel.textContent = `Download for ${platform.shortLabel}`;
		}
		if (hintEl) {
			const detected = detectPlatform();
			if (detected?.id === platform.id) {
				hintEl.hidden = true;
				hintEl.textContent = '';
			} else {
				hintEl.hidden = false;
				hintEl.textContent = `Showing ${platform.label}. Pick another platform if this is not your system.`;
			}
		}
		tabs.forEach((tab) => {
			const selected = tab.dataset.platform === platform.id;
			tab.setAttribute('aria-selected', selected ? 'true' : 'false');
		});
	};

	tabs.forEach((tab) => {
		tab.addEventListener('click', () => {
			const id = tab.dataset.platform as PlatformId | undefined;
			const platform = PLATFORMS.find((p) => p.id === id);
			if (platform) applyPlatform(platform);
		});
	});

	const detected = detectPlatform();
	if (detected) {
		applyPlatform(detected);
	} else {
		applyPlatform(PLATFORMS[0]);
		if (hintEl) {
			const ua = navigator.userAgent;
			if (/Intel Mac OS X|MacIntel/i.test(ua)) {
				hintEl.hidden = false;
				hintEl.textContent =
					'Only Apple Silicon (arm64) macOS builds are published. Use Linux or Windows below, or build from source.';
			} else {
				hintEl.hidden = false;
				hintEl.textContent = 'Could not detect your OS — choose a platform tab above.';
			}
		}
	}

	copyBtn?.addEventListener('click', async () => {
		const defaultLabel = copyLabel?.textContent ?? 'Copy';
		try {
			await navigator.clipboard.writeText(active.installCommand);
			if (copyLabel) copyLabel.textContent = 'Copied';
			window.setTimeout(() => {
				if (copyLabel) copyLabel.textContent = defaultLabel;
			}, 1600);
		} catch {
			if (copyLabel) copyLabel.textContent = 'Failed';
		}
	});

	const vscodeCopyBtn = root.querySelector<HTMLButtonElement>('[data-copy-vscode]');
	const vscodeCopyLabel = vscodeCopyBtn?.querySelector<HTMLElement>('[data-copy-vscode-label]');
	const vscodeCmd =
		vscodeCopyBtn?.closest('.downloads-command')?.querySelector('code')?.textContent ?? '';

	vscodeCopyBtn?.addEventListener('click', async () => {
		const defaultLabel = vscodeCopyLabel?.textContent ?? 'Copy';
		try {
			await navigator.clipboard.writeText(vscodeCmd.trim());
			if (vscodeCopyLabel) vscodeCopyLabel.textContent = 'Copied';
			window.setTimeout(() => {
				if (vscodeCopyLabel) vscodeCopyLabel.textContent = defaultLabel;
			}, 1600);
		} catch {
			if (vscodeCopyLabel) vscodeCopyLabel.textContent = 'Failed';
		}
	});
}

function init(): void {
	document.querySelectorAll<HTMLElement>('[data-downloads-page]').forEach(initDownloadsPage);
}

onPageNavigation(init);
