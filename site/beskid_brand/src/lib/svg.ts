import fontkit from "@pdf-lib/fontkit";
import { INTER } from "./typography";
import type { Point, Shape } from "./geometry";

function pts(s: Point[]): string {
	return s.map(([x, y]) => `${x},${y}`).join(" ");
}

function sEl(el: Shape, indent = 0): string {
	const p = "  ".repeat(indent);
	switch (el.kind) {
        case "masked": {
            const regions = el.body.map(points => `<polygon points="${pts([...points])}" fill="white"/>`).join('');
            const channels = el.cuts.map(points => `<polygon points="${pts([...points])}" fill="black"/>`).join('');
            return `${p}<defs><mask id="${el.id}" maskUnits="userSpaceOnUse" x="0" y="0" width="120" height="120" style="mask-type:luminance">${regions}${channels}</mask></defs><rect width="120" height="120" fill="${el.fill}" mask="url(#${el.id})"/>`;
        }
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
            return `${p}${OutlineText(el)}`;

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
	if (icon.title) inner.push(`  <title>${EscapeXml(icon.title)}</title>`);
	inner.push(...icon.shapes.map((s) => sEl(s, 1)));
	return `<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${EscapeXml(icon.title ?? "beskid")}" viewBox="${x} ${y} ${w} ${h}">\n${inner.join("\n")}\n</svg>`;
}

function EscapeXml(value: string): string {
    return value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]!));
}

const fonts = new Map<number, ReturnType<typeof fontkit.create>>();
/** Outline at generation time: distributed SVG needs no font or network request. */
function OutlineText(el: Extract<Shape, {kind:'text'}>): string {
    let font = fonts.get(el.fontWeight);
    if (!font) {
        const style = Object.values(INTER).find(s => s.weight === el.fontWeight);
        if (!style) throw new Error(`Unsupported brand font weight: ${el.fontWeight}`);
        font = fontkit.create(style.buffer());
        fonts.set(el.fontWeight, font);
    }
    const run = font.layout(el.content);
    const scale = el.fontSize / font.unitsPerEm;
    const width = run.positions.reduce((sum, p) => sum + p.xAdvance * scale, 0)
        + Math.max(0, run.glyphs.length - 1) * el.letterSpacing;
    const offset = el.textAnchor === 'middle' ? width / 2 : el.textAnchor === 'end' ? width : 0;
    let x = el.x - offset;
    return run.glyphs.map((glyph, i) => {
        const position = run.positions[i];
        const path = `<path fill="${el.fill}" transform="translate(${x + position.xOffset * scale} ${el.y - position.yOffset * scale}) scale(${scale} ${-scale})" d="${glyph.path.toSVG()}"/>`;
        x += position.xAdvance * scale + el.letterSpacing;
        return path;
    }).join('');
}
