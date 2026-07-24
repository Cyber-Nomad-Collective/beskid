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
	circle,
	type IconSpec,
	line,
	type Point,
	polygon,
	polyline,
	rrect,
	type Shape,
} from "../lib/geometry";

function drawTopo(color: string, shiftY = 0): Shape[] {
	const s: Shape[] = [];
	// Spur lines behind contours
	for (const sp of SPURS) {
		s.push(line(sp.x1, sp.y1 + shiftY, sp.x2, sp.y2 + shiftY, color, 0.5, 0.22));
	}
	// Contour rings
	for (const c of CONTOURS) {
		const pts = c.points.map(([x, y]) => [x, y + shiftY] as Point);
		s.push(polyline(pts, color, c.strokeWidth, c.opacity));
	}
	// Ridge spine
	const rpts = RIDGE.points.map(([x, y]) => [x, y + shiftY] as Point);
	s.push(polyline(rpts, color, RIDGE.strokeWidth, RIDGE.opacity));
	// Peak dots
	for (const [px, py] of PEAKS) {
		s.push(circle(px, py + shiftY, 1.3, color, 0.85));
	}
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

export function beskidCoreIcon(color = C.tealLight): IconSpec {
	return {
		viewBox: [0, 0, 120, 120],
		shapes: [...drawTopo(color, 2), ...accent("beskid-core", color)],
		title: SERVICE_LABELS["beskid-core"],
	};
}
export function authIcon(color = C.tealLight): IconSpec {
	return {
		viewBox: [0, 0, 120, 120],
		shapes: [...drawTopo(color, 2), ...accent("auth", color)],
		title: SERVICE_LABELS.auth,
	};
}
export function platformSpecIcon(color = C.tealLight): IconSpec {
	return {
		viewBox: [0, 0, 120, 120],
		shapes: [...drawTopo(color, 2), ...accent("platform-spec", color)],
		title: SERVICE_LABELS["platform-spec"],
	};
}
export function learnIcon(color = C.tealLight): IconSpec {
	return {
		viewBox: [0, 0, 120, 120],
		shapes: [...drawTopo(color, 2), ...accent("learn", color)],
		title: SERVICE_LABELS.learn,
	};
}
export function websiteIcon(color = C.tealLight): IconSpec {
	return {
		viewBox: [0, 0, 120, 120],
		shapes: [...drawTopo(color, 2), ...accent("website", color)],
		title: SERVICE_LABELS.website,
	};
}
export function trackerIcon(color = C.tealLight): IconSpec {
	return {
		viewBox: [0, 0, 120, 120],
		shapes: [...drawTopo(color, 2), ...accent("tracker", color)],
		title: SERVICE_LABELS.tracker,
	};
}
export function pckgIcon(color = C.tealLight): IconSpec {
	return {
		viewBox: [0, 0, 120, 120],
		shapes: [...drawTopo(color, 2), ...accent("pckg", color)],
		title: SERVICE_LABELS.pckg,
	};
}
export function nexusIcon(color = C.tealLight): IconSpec {
	return {
		viewBox: [0, 0, 120, 120],
		shapes: [...drawTopo(color, 2), ...accent("nexus", color)],
		title: SERVICE_LABELS.nexus,
	};
}

export const SERVICE_ICONS: Record<ServiceId, (c?: string) => IconSpec> = {
	"beskid-core": beskidCoreIcon,
	auth: authIcon,
	"platform-spec": platformSpecIcon,
	learn: learnIcon,
	website: websiteIcon,
	tracker: trackerIcon,
	pckg: pckgIcon,
	nexus: nexusIcon,
};
export const coreIcon = beskidCoreIcon;
