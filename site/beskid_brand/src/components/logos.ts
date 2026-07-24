import {
	C,
	CONTOURS,
	type LogoVariant,
	PEAKS,
	RIDGE,
	SPURS,
} from "../lib/brand";
import {
	background,
	circle,
	group,
	type IconSpec,
	line,
	type Point,
	polygon,
	polyline,
	type Shape,
	textEl,
} from "../lib/geometry";

function drawTopo(color: string, shiftY = 0): Shape[] {
	const s: Shape[] = [];
	for (const sp of SPURS)
		s.push(line(sp.x1, sp.y1 + shiftY, sp.x2, sp.y2 + shiftY, color, 0.5, 0.22));
	for (const c of CONTOURS) {
		s.push(
			polyline(
				c.points.map(([x, y]) => [x, y + shiftY] as Point),
				color,
				c.strokeWidth,
				c.opacity,
			),
		);
	}
	s.push(
		polyline(
			RIDGE.points.map(([x, y]) => [x, y + shiftY] as Point),
			color,
			RIDGE.strokeWidth,
			RIDGE.opacity,
		),
	);
	for (const [px, py] of PEAKS)
		s.push(circle(px, py + shiftY, 1.3, color, 0.85));
	return s;
}

export function iconVariant(color = C.tealLight): IconSpec {
	return {
		viewBox: [0, 0, 120, 120],
		shapes: [
			...drawTopo(color, 2),
			polygon(
				[
					[52, 90],
					[60, 82],
					[68, 90],
					[60, 98],
				],
				color,
			),
		],
		title: "Beskid",
	};
}
export function stackedVariant(color = C.tealLight): IconSpec {
	const g = group(
		[
			...drawTopo(color, 2),
			polygon(
				[
					[52, 90],
					[60, 82],
					[68, 90],
					[60, 98],
				],
				color,
			),
		],
		{ translate: [20, 8], title: "Beskid" },
	);
	const t = textEl(100, 178, "beskid", color, {
		fontSize: 26,
		fontWeight: 700,
		letterSpacing: 4,
		textAnchor: "middle",
	});
	return { viewBox: [0, 0, 200, 200], shapes: [g, t] };
}
export function horizontalVariant(color = C.tealLight): IconSpec {
	const g = group(
		[
			...drawTopo(color, 2),
			polygon(
				[
					[52, 90],
					[60, 82],
					[68, 90],
					[60, 98],
				],
				color,
			),
		],
		{ translate: [8, 6], scale: 0.5, title: "Beskid" },
	);
	const t = textEl(100, 52, "beskid", color, {
		fontSize: 26,
		fontWeight: 700,
		letterSpacing: 4,
		textAnchor: "start",
	});
	return { viewBox: [0, 0, 300, 80], shapes: [g, t] };
}
export function darkVariant(): IconSpec {
	const c = C.tealLight;
	const bg = background(200, 200, C.bgDark);
	const g = group(
		[
			...drawTopo(c, 2),
			polygon(
				[
					[52, 90],
					[60, 82],
					[68, 90],
					[60, 98],
				],
				c,
			),
		],
		{ translate: [20, 8], title: "Beskid" },
	);
	const t = textEl(100, 178, "beskid", c, {
		fontSize: 26,
		fontWeight: 700,
		letterSpacing: 4,
		textAnchor: "middle",
	});
	return { viewBox: [0, 0, 200, 200], shapes: [bg, g, t] };
}
export const LOGOS: Record<LogoVariant, (c?: string) => IconSpec> = {
	icon: iconVariant,
	"logo-stacked": stackedVariant,
	"logo-horizontal": horizontalVariant,
	"logo-dark": darkVariant,
};
