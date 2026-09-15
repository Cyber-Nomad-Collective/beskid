import { C, MARK_POLYGONS, type LogoVariant } from "../lib/brand";
import { WORDMARK } from "../lib/typography";
import { background, group, type IconSpec, polygon, type Shape, textEl } from "../lib/geometry";

/** The only conversion from canonical mountain geometry to drawable shapes. */
export function DrawMark(color: string): Shape[] {
	return MARK_POLYGONS.map((points) => polygon([...points], color));
}

/** Shared typography for the parent brand and every service lockup. */
export function DrawWordmark(x: number, y: number, color: string, size: number, centered = false): Shape {
	return textEl(x, y, "beskid", color, {
		fontSize: size,
		fontWeight: WORDMARK.beskid.weight,
		letterSpacing: WORDMARK.beskid.letterSpacing / 64 * size,
		textAnchor: centered ? "middle" : "start",
	});
}

export function StackedLockup(mark: Shape[], color: string): Shape[] {
	return [group(mark, { translate: [60, 15] }), DrawWordmark(120, 204, color, 44, true)];
}

export function iconVariant(color: string = C.teal): IconSpec {
	return { viewBox: [0, 0, 120, 120], shapes: DrawMark(color), title: "beskid" };
}

export function stackedVariant(color?: string): IconSpec {
	return {
		viewBox: [0, 0, 240, 240],
		shapes: StackedLockup(DrawMark(color ?? C.teal), color ?? C.ink),
		title: "beskid",
	};
}

export function horizontalVariant(color?: string): IconSpec {
	return {
		viewBox: [0, 0, 360, 120],
		shapes: [...DrawMark(color ?? C.teal), DrawWordmark(142, 80, color ?? C.ink, 64)],
		title: "beskid",
	};
}

export function darkVariant(color?: string): IconSpec {
	return {
		viewBox: [0, 0, 240, 240],
		shapes: [background(240, 240, C.bgDark), ...StackedLockup(DrawMark(color ?? C.tealLight), color ?? C.paper)],
		title: "beskid",
	};
}

export const LOGOS: Record<LogoVariant, (color?: string) => IconSpec> = {
	icon: iconVariant,
	"logo-stacked": stackedVariant,
	"logo-horizontal": horizontalVariant,
	"logo-dark": darkVariant,
};
