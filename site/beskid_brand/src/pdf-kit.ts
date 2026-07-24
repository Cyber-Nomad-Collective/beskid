/**
 * PDF Brand Kit generator.
 * Uses pdf-lib + @pdf-lib/fontkit to embed Inter fonts and render a
 * comprehensive brand guidelines document.
 *
 * Run: npx tsx src/pdf-kit.ts
 */

import fontkit from "@pdf-lib/fontkit";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { PDFDocument, type PDFPage, rgb, StandardFonts } from "pdf-lib";
import { C, SERVICE_LABELS, SERVICES } from "./lib/brand";
import { PALETTE } from "./lib/palette";

const FONT_DIR = join(
	import.meta.dirname!,
	"..",
	"node_modules",
	"@fontsource",
	"inter",
	"files",
);
const OUT = join(import.meta.dirname!, "..", "beskid-brand-kit.pdf");

function loadFont(name: string): Buffer {
	return readFileSync(join(FONT_DIR, name));
}

function toRgb(hex: string) {
	const h = hex.replace("#", "");
	return rgb(
		parseInt(h.substring(0, 2), 16) / 255,
		parseInt(h.substring(2, 4), 16) / 255,
		parseInt(h.substring(4, 6), 16) / 255,
	);
}

async function main() {
	const doc = await PDFDocument.create();
	doc.registerFontkit(fontkit);

	// Load fonts
	const interBoldBuf = loadFont("inter-latin-700-normal.woff2");
	const interRegBuf = loadFont("inter-latin-400-normal.woff2");
	const interLightBuf = loadFont("inter-latin-300-normal.woff2");
	const interBold = await doc.embedFont(interBoldBuf);
	const interReg = await doc.embedFont(interRegBuf);
	const interLight = await doc.embedFont(interLightBuf);

	const TEAL = toRgb(C.teal);
	const TEAL_LIGHT = toRgb(C.tealLight);
	const DARK = toRgb(PALETTE.neutral.dark);
	const WHITE = rgb(1, 1, 1);
	const GRAY = toRgb(PALETTE.neutral[600]);
	const LIGHT_GRAY = toRgb(PALETTE.neutral[200]);

	function addPage(): PDFPage {
		const page = doc.addPage([595, 842]); // A4
		page.setFontSize(10);
		return page;
	}

	// --- Cover ---
	let page = addPage();
	page.drawRectangle({ x: 0, y: 0, width: 595, height: 842, color: DARK });
	page.drawText("beskid", {
		x: 50,
		y: 500,
		size: 72,
		font: interBold,
		color: TEAL_LIGHT,
	});
	page.drawText("Brand Guidelines", {
		x: 50,
		y: 440,
		size: 28,
		font: interLight,
		color: TEAL_LIGHT,
	});
	page.drawText("v0.1.0 — Flat Geometric Design System", {
		x: 50,
		y: 400,
		size: 14,
		font: interReg,
		color: TEAL_LIGHT,
		opacity: 0.7,
	});
	page.drawText("A language you climb, not one handed to you.", {
		x: 50,
		y: 360,
		size: 12,
		font: interLight,
		color: TEAL_LIGHT,
		opacity: 0.5,
	});

	// --- Colors ---
	page = addPage();
	page.drawText("Color Palette", {
		x: 50,
		y: 780,
		size: 32,
		font: interBold,
		color: TEAL,
	});
	page.drawLine({
		start: { x: 50, y: 770 },
		end: { x: 200, y: 770 },
		thickness: 3,
		color: TEAL,
	});

	const colors = [
		{
			name: "Beskid Teal 500",
			hex: C.teal,
			desc: "Primary brand. Logos, links, buttons.",
		},
		{
			name: "Beskid Teal Light",
			hex: C.tealLight,
			desc: "Dark mode variant.",
		},
		{
			name: "Background Dark",
			hex: PALETTE.neutral.dark,
			desc: "Terminal, dark headers.",
		},
		{
			name: "Neutral 600",
			hex: PALETTE.neutral[600],
			desc: "Service name secondary text.",
		},
		{
			name: "Neutral 200",
			hex: PALETTE.neutral[200],
			desc: "Section backgrounds.",
		},
		{
			name: "Success",
			hex: PALETTE.semantic.success,
			desc: "Pass / green gates.",
		},
		{ name: "Danger", hex: PALETTE.semantic.danger, desc: "Errors / alerts." },
		{
			name: "Warning",
			hex: PALETTE.semantic.warning,
			desc: "Warnings / caution.",
		},
	];
	let cy = 740;
	for (const c of colors) {
		const rgbC = toRgb(c.hex);
		page.drawRectangle({
			x: 50,
			y: cy,
			width: 40,
			height: 30,
			color: rgbC,
			borderColor: LIGHT_GRAY,
			borderWidth: 1,
		});
		page.drawText(c.name, {
			x: 105,
			y: cy + 18,
			size: 14,
			font: interBold,
			color: rgbC,
		});
		page.drawText(c.hex + "  —  " + c.desc, {
			x: 105,
			y: cy + 4,
			size: 10,
			font: interReg,
			color: GRAY,
		});
		cy -= 44;
	}

	// --- Typography ---
	page = addPage();
	page.drawText("Typography", {
		x: 50,
		y: 780,
		size: 32,
		font: interBold,
		color: TEAL,
	});
	page.drawLine({
		start: { x: 50, y: 770 },
		end: { x: 200, y: 770 },
		thickness: 3,
		color: TEAL,
	});
	page.drawText("Primary: Inter, system-ui, -apple-system, sans-serif", {
		x: 50,
		y: 740,
		size: 14,
		font: interReg,
		color: GRAY,
	});

	page.drawText("beskid", {
		x: 50,
		y: 690,
		size: 48,
		font: interBold,
		color: TEAL,
	});
	page.drawText("Wordmark — Inter Bold 700, letter-spacing 4px", {
		x: 50,
		y: 675,
		size: 10,
		font: interReg,
		color: GRAY,
	});

	page.drawText("Service Name", {
		x: 50,
		y: 630,
		size: 28,
		font: interLight,
		color: GRAY,
	});
	page.drawText("Service label — Inter Light 300, letter-spacing 1.5px", {
		x: 50,
		y: 615,
		size: 10,
		font: interReg,
		color: GRAY,
	});

	page.drawText("Brand Guidelines Body Text", {
		x: 50,
		y: 570,
		size: 16,
		font: interReg,
		color: DARK,
	});
	page.drawText("Body — Inter Regular 400, 16px", {
		x: 50,
		y: 555,
		size: 10,
		font: interReg,
		color: GRAY,
	});

	page.drawText("ABCDEFGHIJKLMNOPQRSTUVWXYZ", {
		x: 50,
		y: 510,
		size: 18,
		font: interReg,
		color: DARK,
	});
	page.drawText("abcdefghijklmnopqrstuvwxyz", {
		x: 50,
		y: 485,
		size: 18,
		font: interReg,
		color: DARK,
	});
	page.drawText("0123456789 !@#$%^&*()", {
		x: 50,
		y: 460,
		size: 18,
		font: interReg,
		color: DARK,
	});

	// --- Service Icons Table ---
	page = addPage();
	page.drawText("Service Icons", {
		x: 50,
		y: 780,
		size: 32,
		font: interBold,
		color: TEAL,
	});
	page.drawLine({
		start: { x: 50, y: 770 },
		end: { x: 200, y: 770 },
		thickness: 3,
		color: TEAL,
	});

	const svcEntries = Object.entries(SERVICE_LABELS);
	cy = 740;
	for (const [id, label] of svcEntries) {
		page.drawText(label, {
			x: 50,
			y: cy,
			size: 14,
			font: interBold,
			color: TEAL,
		});
		page.drawText("icon-" + id + ".svg  —  120x120, flat geometric", {
			x: 50,
			y: cy - 14,
			size: 10,
			font: interReg,
			color: GRAY,
		});
		cy -= 32;
	}

	// --- Logo Usage ---
	page = addPage();
	page.drawText("Logo Variants", {
		x: 50,
		y: 780,
		size: 32,
		font: interBold,
		color: TEAL,
	});
	page.drawLine({
		start: { x: 50, y: 770 },
		end: { x: 200, y: 770 },
		thickness: 3,
		color: TEAL,
	});
	const variants = [
		{
			name: "beskid-icon.svg",
			desc: "Square icon, 120x120 — favicons, app icons",
		},
		{
			name: "beskid-logo-stacked.svg",
			desc: "Icon above wordmark, 200x180 — default lockup",
		},
		{
			name: "beskid-logo-horizontal.svg",
			desc: "Icon left + wordmark right, 300x80 — headers",
		},
		{
			name: "beskid-logo-dark.svg",
			desc: "Stacked on #0d1117 with #5eeadb, 200x180 — dark mode",
		},
	];
	cy = 740;
	for (const v of variants) {
		page.drawText(v.name, {
			x: 50,
			y: cy,
			size: 12,
			font: interBold,
			color: TEAL,
		});
		page.drawText(v.desc, {
			x: 50,
			y: cy - 14,
			size: 10,
			font: interReg,
			color: GRAY,
		});
		cy -= 32;
	}

	// --- Design Constraints ---
	page = addPage();
	page.drawText("Design Constraints", {
		x: 50,
		y: 780,
		size: 32,
		font: interBold,
		color: TEAL,
	});
	page.drawLine({
		start: { x: 50, y: 770 },
		end: { x: 200, y: 770 },
		thickness: 3,
		color: TEAL,
	});
	const rules = [
		"NO cubic beziers — polylines and polygons only.",
		"NO opacity — fills are solid or absent.",
		"NO gradients — flat color fields only.",
		"NO arcs — no path arc commands.",
		"Stroke: uniform 2px, round caps, round joins.",
		"Mountain polyline identical across all icons.",
		"Inter font, bold (700) for 'beskid', light (300) for service names.",
	];
	cy = 740;
	for (const r of rules) {
		page.drawText("•  " + r, {
			x: 50,
			y: cy,
			size: 12,
			font: interReg,
			color: DARK,
		});
		cy -= 22;
	}

	// --- Merged Service Logos ---
	page = addPage();
	page.drawText("Merged Service Logos", {
		x: 50,
		y: 780,
		size: 32,
		font: interBold,
		color: TEAL,
	});
	page.drawLine({
		start: { x: 50, y: 770 },
		end: { x: 200, y: 770 },
		thickness: 3,
		color: TEAL,
	});
	page.drawText("Horizontal lockup: [icon] beskid Service Name", {
		x: 50,
		y: 740,
		size: 12,
		font: interReg,
		color: GRAY,
	});
	page.drawText("service-{name}-horizontal.svg  —  360x80", {
		x: 50,
		y: 722,
		size: 10,
		font: interReg,
		color: GRAY,
	});
	page.drawText("service-{name}-stacked.svg     —  200x200", {
		x: 50,
		y: 704,
		size: 10,
		font: interReg,
		color: GRAY,
	});
	page.drawText("service-{name}-dark.svg        —  200x200 (dark mode)", {
		x: 50,
		y: 686,
		size: 10,
		font: interReg,
		color: GRAY,
	});

	// --- Brand Voice ---
	page = addPage();
	page.drawText("Brand Voice", {
		x: 50,
		y: 780,
		size: 32,
		font: interBold,
		color: TEAL,
	});
	page.drawLine({
		start: { x: 50, y: 770 },
		end: { x: 200, y: 770 },
		thickness: 3,
		color: TEAL,
	});
	page.drawText('"A language you climb, not one handed to you."', {
		x: 50,
		y: 720,
		size: 16,
		font: interLight,
		color: TEAL,
	});
	page.drawText(
		"Beskid speaks like a seasoned climbing partner — competent, warm, never condescending.",
		{ x: 50, y: 690, size: 12, font: interReg, color: DARK },
	);
	page.drawText(
		"Clear, direct sentences. Technical precision. Honest trade-offs.",
		{ x: 50, y: 666, size: 12, font: interReg, color: GRAY },
	);
	page.drawText('No corporate jargon. No hype. No "revolutionary."', {
		x: 50,
		y: 648,
		size: 12,
		font: interReg,
		color: GRAY,
	});

	const pdfBytes = await doc.save();
	writeFileSync(OUT, pdfBytes);
	console.log("PDF brand kit written: " + OUT);
}

main().catch(console.error);
