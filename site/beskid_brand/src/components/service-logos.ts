import { C, SERVICE_LABELS, type ServiceId } from "../lib/brand";
import { background, type IconSpec, textEl } from "../lib/geometry";
import { ServiceIcon } from "./icons";
import { DrawWordmark, StackedLockup } from "./logos";

function ServiceStack(service: ServiceId, markColor: string, textColor: string): IconSpec {
	return {
		viewBox: [0, 0, 240, 260],
		shapes: [
			...StackedLockup(ServiceIcon(service, markColor).shapes, textColor),
			textEl(120, 236, SERVICE_LABELS[service], textColor, { fontSize: 18, fontWeight: 500, letterSpacing: 0, textAnchor: "middle" }),
		],
		title: `beskid ${SERVICE_LABELS[service]}`,
	};
}

export function mergedServiceHorizontal(service: ServiceId, color?: string): IconSpec {
	return {
		viewBox: [0, 0, 460, 120],
		shapes: [
			...ServiceIcon(service, color ?? C.teal).shapes,
			DrawWordmark(142, 62, color ?? C.ink, 44),
			textEl(142, 91, SERVICE_LABELS[service], color ?? C.ink, { fontSize: 20, fontWeight: 500, letterSpacing: 0, textAnchor: "start" }),
		],
		title: `beskid ${SERVICE_LABELS[service]}`,
	};
}

export function mergedServiceStacked(service: ServiceId, color?: string): IconSpec {
	return ServiceStack(service, color ?? C.teal, color ?? C.ink);
}

export function mergedServiceDark(service: ServiceId, color?: string): IconSpec {
	const spec = ServiceStack(service, color ?? C.tealLight, color ?? C.paper);
	return { ...spec, shapes: [background(240, 260, C.bgDark), ...spec.shapes] };
}
