import {
	C,
	CONTOURS,
	PEAKS,
	RIDGE,
	SERVICE_LABELS,
	type ServiceId,
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
	rrect,
	type Shape,
} from "../lib/geometry";
import { PALETTE } from "../lib/palette";

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

function accent(service: ServiceId, color: string): Shape[] {
	const S = 1.2;
	switch (service) {
		case "beskid-core":
			return [
				polygon(
					[
						[52, 90],
						[60, 82],
						[68, 90],
						[60, 98],
					],
					color,
				),
			];
		case "auth":
			return [
				polygon(
					[
						[42, 88],
						[78, 88],
						[74, 104],
						[60, 112],
						[46, 104],
					],
					undefined,
					undefined,
					color,
					S,
				),
			];
		case "platform-spec":
			return [
				rrect(40, 86, 40, 26, undefined, color, S),
				line(46, 94, 74, 94, color, S),
				line(46, 101, 66, 101, color, S),
			];
		case "learn":
			return [
				polygon(
					[
						[42, 90],
						[57, 86],
						[57, 108],
						[42, 112],
					],
					undefined,
					undefined,
					color,
					S,
				),
				polygon(
					[
						[63, 86],
						[78, 90],
						[78, 112],
						[63, 108],
					],
					undefined,
					undefined,
					color,
					S,
				),
			];
		case "website":
			return [
				polygon(
					[
						[60, 100],
						[68, 96],
						[72, 88],
						[72, 80],
						[68, 72],
						[60, 68],
						[52, 72],
						[48, 80],
						[48, 88],
						[52, 96],
					],
					undefined,
					undefined,
					color,
					S,
				),
				line(48, 84, 72, 84, color, S),
			];
		case "tracker":
			return [
				rrect(43, 92, 8, 8, color),
				rrect(56, 92, 8, 8, color),
				rrect(69, 92, 8, 8, color),
			];
		case "pckg":
			return [
				rrect(42, 88, 20, 20, undefined, color, S),
				polygon(
					[
						[42, 88],
						[52, 80],
						[72, 80],
						[62, 88],
					],
					undefined,
					undefined,
					color,
					S,
				),
			];
		case "nexus":
			return [
				line(48, 100, 60, 88, color, S),
				line(60, 88, 72, 100, color, S),
				line(48, 100, 72, 100, color, S),
				polygon(
					[
						[44, 100],
						[48, 96],
						[52, 100],
						[48, 104],
					],
					color,
				),
				polygon(
					[
						[56, 88],
						[60, 84],
						[64, 88],
						[60, 92],
					],
					color,
				),
				polygon(
					[
						[68, 100],
						[72, 96],
						[76, 100],
						[72, 104],
					],
					color,
				),
			];
		default:
			return [];
	}
}

function mkText(
	x: number,
	y: number,
	c: string,
	fill: string,
	fw: number,
	fs: number,
	ls: number,
	ta: "start" | "middle" | "end" = "start",
): any {
	return {
		kind: "text",
		x,
		y,
		content: c,
		fontFamily: "Inter, system-ui, -apple-system, sans-serif",
		fontSize: fs,
		fontWeight: fw,
		letterSpacing: ls,
		textAnchor: ta,
		fill,
	};
}

export function mergedServiceHorizontal(
	service: ServiceId,
	color = C.tealLight,
): IconSpec {
	const label = SERVICE_LABELS[service];
	return {
		viewBox: [0, 0, 360, 80],
		shapes: [
			group([...drawTopo(color, 2), ...accent(service, color)], {
				translate: [8, 6],
				scale: 0.45,
			}),
			mkText(68, 50, "beskid", color, 700, 22, 3, "start"),
			mkText(158, 50, label, PALETTE.neutral[600], 300, 14, 1.5, "start"),
		],
		title: label,
	};
}
export function mergedServiceStacked(
	service: ServiceId,
	color = C.tealLight,
): IconSpec {
	const label = SERVICE_LABELS[service];
	return {
		viewBox: [0, 0, 200, 200],
		shapes: [
			group([...drawTopo(color, 2), ...accent(service, color)], {
				translate: [20, 8],
			}),
			mkText(100, 178, "beskid", color, 700, 22, 3, "middle"),
			mkText(100, 195, label, PALETTE.neutral[500], 300, 11, 1.5, "middle"),
		],
		title: label,
	};
}
export function mergedServiceDark(service: ServiceId): IconSpec {
	const c = C.tealLight;
	const label = SERVICE_LABELS[service];
	return {
		viewBox: [0, 0, 200, 200],
		shapes: [
			background(200, 200, C.bgDark),
			group([...drawTopo(c, 2), ...accent(service, c)], { translate: [20, 8] }),
			mkText(100, 178, "beskid", c, 700, 22, 3, "middle"),
			mkText(100, 195, label, PALETTE.darkTeal[300], 300, 11, 1.5, "middle"),
		],
		title: label,
	};
}
