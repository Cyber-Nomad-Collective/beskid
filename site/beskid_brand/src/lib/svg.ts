import type { Point, Shape } from "./geometry";

function pts(s: Point[]): string {
	return s.map(([x, y]) => `${x},${y}`).join(" ");
}

function sEl(el: Shape, indent = 0): string {
	const p = "  ".repeat(indent);
	switch (el.kind) {
		case "polyline": {
			let a = `points="${pts(el.points)}" fill="none" stroke="${el.stroke}" stroke-width="${el.strokeWidth}" stroke-linecap="${el.strokeLinecap}" stroke-linejoin="${el.strokeLinejoin}"`;
			if (el.opacity !== undefined) a += ` opacity="${el.opacity}"`;
			return `${p}<polyline ${a}/>`;
		}
		case "polygon": {
			let a = `points="${pts(el.points)}"`;
			a += el.fill ? ` fill="${el.fill}"` : ` fill="none"`;
			if (el.fillOpacity !== undefined) a += ` fill-opacity="${el.fillOpacity}"`;
			a += el.stroke ? ` stroke="${el.stroke}"` : ` stroke="none"`;
			if (el.strokeWidth !== undefined) a += ` stroke-width="${el.strokeWidth}"`;
			if (el.stroke && el.strokeLinecap)
				a += ` stroke-linecap="${el.strokeLinecap}"`;
			if (el.stroke && el.strokeLinejoin)
				a += ` stroke-linejoin="${el.strokeLinejoin}"`;
			return `${p}<polygon ${a}/>`;
		}
		case "line": {
			let a = `x1="${el.x1}" y1="${el.y1}" x2="${el.x2}" y2="${el.y2}" stroke="${el.stroke}" stroke-width="${el.strokeWidth}" stroke-linecap="${el.strokeLinecap}"`;
			if (el.opacity !== undefined) a += ` opacity="${el.opacity}"`;
			return `${p}<line ${a}/>`;
		}
		case "circle": {
			let a = `<circle cx="${el.cx}" cy="${el.cy}" r="${el.r}" fill="${el.fill}"`;
			if (el.opacity !== undefined) a += ` opacity="${el.opacity}"`;
			return `${a}/>`;
		}
		case "text":
			return `${p}<text x="${el.x}" y="${el.y}" font-family="${el.fontFamily}" font-size="${el.fontSize}" font-weight="${el.fontWeight}" letter-spacing="${el.letterSpacing}" text-anchor="${el.textAnchor}" fill="${el.fill}">${el.content}</text>`;
		case "rect": {
			let a = `x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}"`;
			a += el.fill ? ` fill="${el.fill}"` : ` fill="none"`;
			a += el.stroke ? ` stroke="${el.stroke}"` : ` stroke="none"`;
			if (el.strokeWidth !== undefined) a += ` stroke-width="${el.strokeWidth}"`;
			if (el.stroke && el.strokeLinecap)
				a += ` stroke-linecap="${el.strokeLinecap}"`;
			if (el.stroke && el.strokeLinejoin)
				a += ` stroke-linejoin="${el.strokeLinejoin}"`;
			return `${p}<rect ${a}/>`;
		}
		case "group": {
			const tx: string[] = [];
			if (el.translate)
				tx.push(`translate(${el.translate[0]},${el.translate[1]})`);
			if (el.scale !== undefined) tx.push(`scale(${el.scale})`);
			const ta = tx.length ? ` transform="${tx.join(" ")}"` : "";
			const inner: string[] = [];
			if (el.title) inner.push(`${p}  <title>${el.title}</title>`);
			inner.push(...el.children.map((c) => sEl(c, indent + 1)));
			return `${p}<g${ta}>\n${inner.join("\n")}\n${p}</g>`;
		}
	}
}

export function renderIcon(icon: {
	viewBox: [number, number, number, number];
	shapes: Shape[];
	title?: string;
}): string {
	const [x, y, w, h] = icon.viewBox;
	const inner: string[] = [];
	if (icon.title) inner.push(`  <title>${icon.title}</title>`);
	inner.push(...icon.shapes.map((s) => sEl(s, 1)));
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${w} ${h}">\n${inner.join("\n")}\n</svg>`;
}
