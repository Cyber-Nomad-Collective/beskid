/**
 * Lottie animation generator for Beskid brand — 3D mesh mountain.
 * Run: npx tsx src/lottie-gen.ts
 */
import { writeFileSync } from "fs";
import { join } from "path";
import { C, MESH_FACETS, RIDGE_BACK, RIDGE_FRONT } from "./lib/brand";

const OUT = join(import.meta.dirname!, "..");

interface LottieAnim {
	v: string;
	w: number;
	h: number;
	nm: string;
	ip: number;
	op: number;
	fr: number;
	layers: any[];
}

function baseAnim(
	name: string,
	w = 120,
	h = 120,
	frames = 60,
	fps = 30,
): LottieAnim {
	return { v: "5.12.4", w, h, nm: name, ip: 0, op: frames, fr: fps, layers: [] };
}

function pointLayer(
	name: string,
	pts: readonly [number, number][],
	color: number[],
	closed: boolean,
	fill?: boolean,
	opacity?: number,
): any {
	const v: any[] = [],
		i: any[] = [],
		o: any[] = [];
	for (const [x, y] of pts) {
		v.push([x, y]);
		i.push([0, 0]);
		o.push([0, 0]);
	}
	return {
		ddd: 0,
		ty: 4,
		nm: name,
		sr: 1,
		ks: {
			o: { a: 0, k: 100 },
			r: { a: 0, k: 0 },
			p: { a: 0, k: [60, 60, 0] },
			a: { a: 0, k: [0, 0, 0] },
			s: { a: 0, k: [100, 100, 100] },
		},
		shapes: [
			{ ty: "sh", nm: name, ks: { a: 0, k: { c: closed, v, i, o } } },
			fill === true
				? {
						ty: "fl",
						nm: "Fill",
						c: { a: 0, k: color },
						o: { a: 0, k: opacity !== undefined ? opacity * 100 : 100 },
					}
				: {
						ty: "st",
						nm: "Stroke",
						c: { a: 0, k: color },
						w: { a: 0, k: 2.5 },
						lc: 2,
						lj: 2,
						o: { a: 0, k: 100 },
					},
		],
	};
}

function static3DMesh(): any {
	const a = baseAnim("Beskid 3D Mesh Static", 120, 120, 1, 30);
	const teal = [0.227, 0.675, 0.62, 1];
	const dark = [0.102, 0.42, 0.384, 1];
	a.layers = [];
	// Facets
	for (const tri of MESH_FACETS) {
		a.layers.push(pointLayer("Facet", tri, teal, true, true, C.fillOpacity));
	}
	// Front ridge
	a.layers.push(pointLayer("Front Ridge", RIDGE_FRONT, teal, false));
	// Back ridge
	a.layers.push(pointLayer("Back Ridge", RIDGE_BACK, dark, false));
	return a;
}

function drawOnMesh(): any {
	const a = baseAnim("Beskid 3D Mesh Draw", 120, 120, 75, 30);
	const teal = [0.227, 0.675, 0.62, 1];
	const dark = [0.102, 0.42, 0.384, 1];
	a.layers = [];
	// Facets
	for (const tri of MESH_FACETS) {
		const layer = pointLayer("Facet", tri, teal, true, true, C.fillOpacity);
		layer.shapes[1].o = {
			a: 1,
			k: [
				{ t: 0, s: [0] },
				{ t: 10, s: [100] },
			],
		}; // fade in
		a.layers.push(layer);
	}
	// Front ridge with draw-on effect using trim paths
	const ridgeLayer = pointLayer("Front Ridge", RIDGE_FRONT, teal, false);
	ridgeLayer.shapes.unshift({
		ty: "tm",
		nm: "Trim",
		s: { a: 0, k: 0 },
		e: {
			a: 1,
			k: [
				{ t: 0, s: [0] },
				{ t: 50, s: [100] },
			],
		},
		o: { a: 0, k: 0 },
		m: 1,
	});
	a.layers.push(ridgeLayer);
	const backLayer = pointLayer("Back Ridge", RIDGE_BACK, dark, false);
	backLayer.shapes.unshift({
		ty: "tm",
		nm: "Trim",
		s: { a: 0, k: 0 },
		e: {
			a: 1,
			k: [
				{ t: 10, s: [0] },
				{ t: 60, s: [100] },
			],
		},
		o: { a: 0, k: 0 },
		m: 1,
	});
	a.layers.push(backLayer);
	return a;
}

function writeLottie(filename: string, data: any): void {
	writeFileSync(join(OUT, filename), JSON.stringify(data, null, 2), "utf-8");
	console.log("  Wrote " + filename);
}

console.log("Generating Lottie animations (3D mesh)...\n");
writeLottie("beskid-logo-static.json", static3DMesh());
writeLottie("beskid-logo-draw.json", drawOnMesh());
console.log("\nDone.");
