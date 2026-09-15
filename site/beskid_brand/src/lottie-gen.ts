/** Generate motion from the same solid polygons as the SVG mark. */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { C, MARK_POLYGONS } from "./lib/brand";

const color = C.teal.slice(1).match(/../g)!.map((value) => parseInt(value, 16) / 255);

function Animation(animated: boolean) {
	const frames = animated ? 45 : 1;
	return {
		v: "5.12.4", w: 120, h: 120, nm: "beskid", ip: 0, op: frames, fr: 30,
		ddd: 0, assets: [],
		layers: MARK_POLYGONS.map((points, index) => ({
			ddd: 0, ind: index + 1, ty: 4, nm: `Ridge ${index + 1}`, sr: 1,
			ip: 0, op: frames, st: 0, bm: 0,
			ks: {
				o: animated ? { a: 1, k: [
					{ t: 0, s: [0], e: [100], o: { x: [0.33], y: [0] }, i: { x: [0.67], y: [1] } },
					{ t: 18, s: [100] },
				] } : { a: 0, k: 100 },
				r: { a: 0, k: 0 }, p: { a: 0, k: [0, 0, 0] },
				a: { a: 0, k: [0, 0, 0] }, s: { a: 0, k: [100, 100, 100] },
			},
			shapes: [
				{ ty: "sh", nm: "Ridge polygon", ks: { a: 0, k: {
					c: true, v: points, i: points.map(() => [0, 0]), o: points.map(() => [0, 0]),
				} } },
				{ ty: "fl", nm: "Teal", c: { a: 0, k: [...color, 1] }, o: { a: 0, k: 100 }, r: 1 },
			],
		})),
	};
}

for (const [name, animated] of [["static", false], ["draw", true]] as const) {
	const filename = `beskid-logo-${name}.json`;
	writeFileSync(join(import.meta.dirname, "..", filename), `${JSON.stringify(Animation(animated), null, 2)}\n`);
	console.log(`Generated ${filename}`);
}
