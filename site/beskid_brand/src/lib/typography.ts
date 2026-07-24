/**
 * Beskid typography system.
 *
 * Font stack: Inter (primary) + system-ui fallback.
 *
 * Design principle:
 *   "beskid" wordmark → always bold weight (700)
 *   service name      → light weight (300)
 *   body text         → regular weight (400)
 *   code              → monospace
 *
 * Inter is bundled via @fontsource/inter.
 * Font files: node_modules/@fontsource/inter/files/inter-latin-{weight}-normal.woff2
 *
 * For PDF embedding: use the woff2 files directly (pdf-lib/fontkit supports woff2).
 * For SVG: reference "Inter" with system-ui fallback.
 * For Canvas/node: load woff2 buffer via fontkit.
 */

import { readFileSync } from "fs";
import { join } from "path";

const FONT_ROOT = join(
	import.meta.dirname!,
	"..",
	"..",
	"node_modules",
	"@fontsource",
	"inter",
	"files",
);

export interface FontStyle {
	weight: number;
	style: "normal" | "italic";
	family: string;
	label: string;
	/** Buffer for PDF embedding */
	buffer: () => Buffer;
	/** CSS font-weight for SVG */
	cssWeight: number;
}

/** All Inter weights used by the brand system. */
export const INTER = {
	light: {
		weight: 300,
		style: "normal" as const,
		family: "Inter",
		label: "Inter Light",
		cssWeight: 300,
		buffer: () => readFileSync(join(FONT_ROOT, "inter-latin-300-normal.woff2")),
	},
	regular: {
		weight: 400,
		style: "normal" as const,
		family: "Inter",
		label: "Inter Regular",
		cssWeight: 400,
		buffer: () => readFileSync(join(FONT_ROOT, "inter-latin-400-normal.woff2")),
	},
	medium: {
		weight: 500,
		style: "normal" as const,
		family: "Inter",
		label: "Inter Medium",
		cssWeight: 500,
		buffer: () => readFileSync(join(FONT_ROOT, "inter-latin-500-normal.woff2")),
	},
	semiBold: {
		weight: 600,
		style: "normal" as const,
		family: "Inter",
		label: "Inter Semi Bold",
		cssWeight: 600,
		buffer: () => readFileSync(join(FONT_ROOT, "inter-latin-600-normal.woff2")),
	},
	bold: {
		weight: 700,
		style: "normal" as const,
		family: "Inter",
		label: "Inter Bold",
		cssWeight: 700,
		buffer: () => readFileSync(join(FONT_ROOT, "inter-latin-700-normal.woff2")),
	},
} as const;

/** Typography scale — harmonized sizes for the brand. */
export const SCALE = {
	/** Tiny labels / captions */
	xs: 10,
	/** Small metadata */
	sm: 12,
	/** Body text */
	base: 14,
	/** Subheadings */
	md: 16,
	/** Section headings */
	lg: 20,
	/** Page headings */
	xl: 26,
	/** Display / logo wordmark */
	"2xl": 32,
	/** Hero */
	"3xl": 42,
} as const;

/** Font family string for SVG/CSS. */
export const FONT_FAMILY = "Inter, system-ui, -apple-system, sans-serif";
export const FONT_FAMILY_MONO =
	"SF Mono, Fira Code, Cascadia Code, ui-monospace, monospace";

/** Beskid logo typography spec. */
export const WORDMARK = {
	family: "Inter, system-ui, -apple-system, sans-serif",
	/** "beskid" wordmark */
	beskid: { weight: 700, letterSpacing: 4 },
	/** Service name in stacked lockups */
	service: { weight: 300, letterSpacing: 2 },
	/** Tagline */
	tagline: { weight: 400, letterSpacing: 1 },
} as const;
