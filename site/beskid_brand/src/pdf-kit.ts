/** A compact, reproducible specimen; BRAND.md owns usage guidance. */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, type PDFPage, rgb } from "pdf-lib";
import { C, MARK_POLYGONS } from "./lib/brand";
import { INTER, WORDMARK } from "./lib/typography";

function Color(hex: string) {
	const channels = hex.slice(1).match(/../g)!.map((value) => parseInt(value, 16) / 255);
	return rgb(channels[0], channels[1], channels[2]);
}

function Mark(page: PDFPage, x: number, top: number, size: number, hex: string) {
	for (const points of MARK_POLYGONS) {
		const path = points.map(([px, py], index) => `${index ? "L" : "M"}${px} ${py}`).join(" ") + " Z";
		page.drawSvgPath(path, { x, y: top, scale: size / 120, color: Color(hex) });
	}
}

function DrawText(page: PDFPage, text: string, options: { x: number; y: number; size: number; letterSpacing?: number; font: ReturnType<typeof fontkit.create>; color: ReturnType<typeof rgb> }) {
	const run = options.font.layout(text);
	const scale = options.size / options.font.unitsPerEm;
	let x = options.x;
	for (let index = 0; index < run.glyphs.length; index++) {
		const position = run.positions[index];
		const path = run.glyphs[index].path as typeof run.glyphs[number]["path"] & { scale(x: number, y: number): { toSVG(): string } };
		page.drawSvgPath(path.scale(1, -1).toSVG(), {
			x: x + position.xOffset * scale, y: options.y + position.yOffset * scale,
			scale, color: options.color,
		});
		x += position.xAdvance * scale + (options.letterSpacing ?? 0);
	}
}

async function Main() {
	const document = await PDFDocument.create();

	document.setTitle("beskid brand specimen");
	document.setAuthor("beskid");
	document.setCreationDate(new Date("2026-09-15T00:00:00Z"));
	document.setModificationDate(new Date("2026-09-15T00:00:00Z"));
	const regular = fontkit.create(INTER.regular.buffer());
	const bold = fontkit.create(INTER.bold.buffer());
	for (const dark of [false, true]) {
		const page = document.addPage([595, 842]);
		const foreground = dark ? C.tealLight : C.teal;
		const ink = dark ? "#FFFFFF" : C.bgDark;
		page.drawRectangle({ x: 0, y: 0, width: 595, height: 842, color: Color(dark ? C.bgDark : "#FFFFFF") });
		DrawText(page, "beskid / brand specimen", { x: 48, y: 788, size: 13, font: regular, color: Color(ink) });
		Mark(page, 177.5, 718, 240, foreground);
		const wordmark = "beskid";
		DrawText(page, wordmark, { x: (595 - (bold.layout(wordmark).advanceWidth * 60 / bold.unitsPerEm + 5 * WORDMARK.beskid.letterSpacing / 64 * 60)) / 2, y: 448, size: 60, letterSpacing: WORDMARK.beskid.letterSpacing / 64 * 60, font: bold, color: Color(dark ? C.paper : C.ink) });
		DrawText(page, dark ? "Reversed on forest" : "Primary on white", { x: 48, y: 368, size: 12, font: regular, color: Color(ink) });
		let x = 48;
		for (const size of [16, 24, 32, 48, 64]) {
			Mark(page, x, 327, size, foreground);
			DrawText(page, `${size} pt`, { x, y: 242, size: 9, font: regular, color: Color(ink) });
			x += 100;
		}
		for (const [index, [name, hex]] of (["teal", "tealLight", "ink", "paper"] as const).map((name) => [name, C[name]] as const).entries()) {
			const left = 48 + index * 124;
			page.drawRectangle({ x: left, y: 144, width: 108, height: 44, color: Color(hex) });
			DrawText(page, name, { x: left, y: 125, size: 10, font: regular, color: Color(ink) });
			DrawText(page, hex, { x: left, y: 110, size: 10, font: regular, color: Color(ink) });
		}
		DrawText(page, "Usage, clear space, licensing and source references: BRAND.md", { x: 48, y: 52, size: 10, font: regular, color: Color(ink) });
	}
	writeFileSync(join(import.meta.dirname, "..", "beskid-brand-kit.pdf"), await document.save());
	console.log("Generated beskid-brand-kit.pdf");
}

await Main();
