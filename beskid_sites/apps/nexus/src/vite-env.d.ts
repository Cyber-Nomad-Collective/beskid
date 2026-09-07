/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_NEXUS_DEFAULT_REPO?: string;
	readonly VITE_NEXUS_HOSTED?: string;
	/** Bypass backend auth and use a mock admin user (dev convenience). */
	readonly SHELL_AUTH_MODE?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
