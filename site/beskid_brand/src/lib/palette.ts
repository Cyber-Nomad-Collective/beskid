/**
 * Full Beskid color palette — tints, shades, and semantic roles.
 * Generated from #3aac9e base using luminance-preserving shifts.
 *
 * "Beskid Teal" — the mineral green of Carpathian mountain lakes.
 */

const BASE_TEAL = "#3aac9e";

function hexToRgb(hex: string): [number, number, number] {
	const h = hex.replace("#", "");
	return [
		parseInt(h.substring(0, 2), 16),
		parseInt(h.substring(2, 4), 16),
		parseInt(h.substring(4, 6), 16),
	];
}

function tint(hex: string, t: number): string {
	const [r, g, b] = hexToRgb(hex);
	const nr = Math.round(r + (255 - r) * t);
	const ng = Math.round(g + (255 - g) * t);
	const nb = Math.round(b + (255 - b) * t);
	return (
		"#" +
		nr.toString(16).padStart(2, "0") +
		ng.toString(16).padStart(2, "0") +
		nb.toString(16).padStart(2, "0")
	);
}

function shade(hex: string, t: number): string {
	const [r, g, b] = hexToRgb(hex);
	const nr = Math.round(r * (1 - t));
	const ng = Math.round(g * (1 - t));
	const nb = Math.round(b * (1 - t));
	return (
		"#" +
		nr.toString(16).padStart(2, "0") +
		ng.toString(16).padStart(2, "0") +
		nb.toString(16).padStart(2, "0")
	);
}

export const TEAL = {
	50: tint(BASE_TEAL, 0.88),
	100: tint(BASE_TEAL, 0.72),
	200: tint(BASE_TEAL, 0.52),
	300: tint(BASE_TEAL, 0.32),
	400: tint(BASE_TEAL, 0.14),
	500: BASE_TEAL,
	600: shade(BASE_TEAL, 0.12),
	700: shade(BASE_TEAL, 0.28),
	800: shade(BASE_TEAL, 0.45),
	900: shade(BASE_TEAL, 0.65),
} as const;

export const DARK_MODE_TEAL = {
	50: "#5eeadb",
	100: shade("#5eeadb", 0.08),
	200: shade("#5eeadb", 0.18),
	300: shade("#5eeadb", 0.3),
	400: shade("#5eeadb", 0.42),
	500: "#5eeadb",
	600: tint("#5eeadb", 0.08),
	700: tint("#5eeadb", 0.18),
	800: tint("#5eeadb", 0.3),
	900: tint("#5eeadb", 0.42),
} as const;

export const NEUTRAL = {
	white: "#ffffff",
	50: "#f8f9fa",
	100: "#f1f3f5",
	200: "#e9ecef",
	300: "#dee2e6",
	400: "#ced4da",
	500: "#adb5bd",
	600: "#868e96",
	700: "#495057",
	800: "#343a40",
	900: "#212529",
	dark: "#0d1117",
} as const;

export const SEMANTIC = {
	primary: "#3aac9e",
	primaryLight: "#5eeadb",
	success: "#2dba4e",
	warning: "#dbab09",
	danger: "#cf222e",
	info: "#58a6ff",
} as const;

export const PALETTE = {
	teal: TEAL,
	darkTeal: DARK_MODE_TEAL,
	neutral: NEUTRAL,
	semantic: SEMANTIC,
} as const;
