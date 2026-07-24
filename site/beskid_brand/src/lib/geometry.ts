/**
 * Geometry primitives — contour map edition.
 */
export type Point = readonly [number, number];

export interface Polyline {
	kind: "polyline";
	points: Point[];
	stroke: string;
	strokeWidth: number;
	strokeLinecap: string;
	strokeLinejoin: string;
	opacity?: number;
}
export interface Polygon {
	kind: "polygon";
	points: Point[];
	fill?: string;
	fillOpacity?: number;
	stroke?: string;
	strokeWidth?: number;
	strokeLinecap?: string;
	strokeLinejoin?: string;
}
export interface Line {
	kind: "line";
	x1: number;
	y1: number;
	x2: number;
	y2: number;
	stroke: string;
	strokeWidth: number;
	strokeLinecap: string;
	opacity?: number;
}
export interface Circle {
	kind: "circle";
	cx: number;
	cy: number;
	r: number;
	fill: string;
	opacity?: number;
}
export interface Text {
	kind: "text";
	x: number;
	y: number;
	content: string;
	fontFamily: string;
	fontSize: number;
	fontWeight: number;
	letterSpacing: number;
	textAnchor: "start" | "middle" | "end";
	fill: string;
}
export interface Rect {
	kind: "rect";
	x: number;
	y: number;
	width: number;
	height: number;
	fill?: string;
	stroke?: string;
	strokeWidth?: number;
	strokeLinecap?: string;
	strokeLinejoin?: string;
}
export interface Group {
	kind: "group";
	children: Shape[];
	translate?: Point;
	scale?: number;
	title?: string;
}
export type Shape = Polyline | Polygon | Line | Circle | Text | Rect | Group;

export interface IconSpec {
	viewBox: [number, number, number, number];
	shapes: Shape[];
	title?: string;
}

// ---- Constructors ----
export const polyline = (
	pts: Point[],
	stroke: string,
	sw?: number,
	opacity?: number,
	lc?: string,
	lj?: string,
): Polyline => ({
	kind: "polyline",
	points: pts,
	stroke,
	strokeWidth: sw ?? 1.5,
	strokeLinecap: lc ?? "round",
	strokeLinejoin: lj ?? "round",
	opacity,
});
export const polygon = (
	pts: Point[],
	fill?: string,
	fillOpacity?: number,
	stroke?: string,
	sw?: number,
): Polygon => {
	const r: Polygon = {
		kind: "polygon",
		points: pts,
		fill,
		fillOpacity,
		stroke,
		strokeWidth: sw,
	};
	if (stroke) {
		r.strokeLinecap = "round";
		r.strokeLinejoin = "round";
	}
	return r;
};
export const line = (
	x1: number,
	y1: number,
	x2: number,
	y2: number,
	stroke: string,
	sw?: number,
	opacity?: number,
): Line => ({
	kind: "line",
	x1,
	y1,
	x2,
	y2,
	stroke,
	strokeWidth: sw ?? 1.5,
	strokeLinecap: "round",
	opacity,
});
export const circle = (
	cx: number,
	cy: number,
	r: number,
	fill: string,
	opacity?: number,
): Circle => ({ kind: "circle", cx, cy, r, fill, opacity });
export const rrect = (
	x: number,
	y: number,
	w: number,
	h: number,
	fill?: string,
	stroke?: string,
	sw?: number,
): Rect => {
	const r: Rect = {
		kind: "rect",
		x,
		y,
		width: w,
		height: h,
		fill,
		stroke,
		strokeWidth: sw,
	};
	if (stroke) {
		r.strokeLinecap = "round";
		r.strokeLinejoin = "round";
	}
	return r;
};
export const textEl = (
	x: number,
	y: number,
	c: string,
	fill: string,
	o?: Partial<
		Pick<Text, "fontSize" | "fontWeight" | "letterSpacing" | "textAnchor">
	>,
): Text => ({
	kind: "text",
	x,
	y,
	content: c,
	fill,
	fontFamily: "Inter, system-ui, -apple-system, sans-serif",
	fontSize: o?.fontSize ?? 26,
	fontWeight: o?.fontWeight ?? 400,
	letterSpacing: o?.letterSpacing ?? 4,
	textAnchor: o?.textAnchor ?? "middle",
});
export const background = (w: number, h: number, fill: string): Rect =>
	rrect(0, 0, w, h, fill);
export const group = (
	children: Shape[],
	opts?: { translate?: Point; scale?: number; title?: string },
): Group => ({
	kind: "group",
	children,
	translate: opts?.translate,
	scale: opts?.scale,
	title: opts?.title,
});
