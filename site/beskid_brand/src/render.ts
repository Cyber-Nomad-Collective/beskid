import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { C, RIDGE, FACETS, SERVICES, SERVICE_LABELS, SERVICE_SHORT, type ServiceId } from "./lib/brand";

const el = React.createElement;
const Frag = React.Fragment;

/** Mountain — poly-faceted 3D body with dramatic ridgeline. */
function Mountain({ color = C.teal, flat = false, size = 120 }: { color?: string; flat?: boolean; size?: number }) {
  const s = size / 120;
  const ridge = RIDGE.map(([x, y]) => `${x},${y}`).join(" ");
  const fillCol = color === C.teal ? C.tealDark : C.tealLightDark;
  const kids: any[] = [];
  if (!flat) {
    for (let i = 0; i < FACETS.length; i++) {
      kids.push(el("polygon", {
        points: FACETS[i].map(([x, y]) => `${x},${y}`).join(" "),
        fill: fillCol,
        stroke: "none",
      }));
    }
  }
  kids.push(el("polyline", {
    points: ridge,
    fill: "none",
    stroke: color,
    strokeWidth: C.strokeW,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  }));
  if (s === 1) return el(Frag, null, ...kids);
  return el("g", { transform: `scale(${s})` }, el(Frag, null, ...kids));
}

/** Diamond mark. */
function Diamond({ color = C.teal, size = 10 }: { color?: string; size?: number }) {
  const s = size / 10;
  return el("polygon", {
    points: `52,${80-s} 60,${70-s} 68,${80-s} 60,${90+s}`,
    fill: color,
    stroke: "none",
  });
}

/** Wordmark. */
function Wm({ color = C.teal, x = 0, y = 0, size = 22, anchor = "middle" as const, tracking = 4, text = "beskid" }: {
  color?: string; x?: number; y?: number; size?: number; anchor?: "start"|"middle"|"end"; tracking?: number; text?: string;
}) {
  return el("text", {
    x, y, fontFamily: "system-ui, -apple-system, sans-serif",
    fontSize: size, fontWeight: 400, letterSpacing: tracking,
    textAnchor: anchor, fill: color,
  }, text);
}

function Accent({ svc, color = C.teal, compact = false }: { svc: ServiceId; color?: string; compact?: boolean }) {
  const S = { stroke: color, strokeWidth: C.strokeW, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" as const };
  const F = { fill: color, stroke: "none" };
  const dy = compact ? 6 : 0;
  switch (svc) {
    case "beskid-core":
      return el("g", { transform: compact ? "scale(0.75) translate(18, 14)" : undefined },
        el("polygon", { points: "50,80 60,70 70,80 60,90", ...F }));
    case "auth":
      return el("g", { transform: compact ? "scale(0.75) translate(18, 14)" : undefined },
        el("polygon", { points: `34,${74+dy} 86,${74+dy} 82,${100+dy} 60,${114+dy} 38,${100+dy}`, ...S }));
    case "platform-spec":
      return el("g", { transform: compact ? "scale(0.75) translate(18, 14)" : undefined },
        el("rect", { x: 32, y: 72 + dy, width: 56, height: 34, ...S }),
        el("line", { x1: 38, y1: 81 + dy, x2: 82, y2: 81 + dy, stroke: color, strokeWidth: C.strokeW, strokeLinecap: "round" }),
        el("line", { x1: 38, y1: 91 + dy, x2: 70, y2: 91 + dy, stroke: color, strokeWidth: C.strokeW, strokeLinecap: "round" }));
    case "learn":
      return el("g", { transform: compact ? "scale(0.75) translate(18, 14)" : undefined },
        el("polygon", { points: `34,${76+dy} 58,${68+dy} 58,${106+dy} 34,${114+dy}`, ...S }),
        el("polygon", { points: `62,${68+dy} 86,${76+dy} 86,${114+dy} 62,${106+dy}`, ...S }));
    case "website":
      return el("g", { transform: compact ? "scale(0.75) translate(18, 14)" : undefined },
        el("polygon", { points: `60,${100+dy} 74,${90+dy} 78,${78+dy} 78,${68+dy} 74,${56+dy} 60,${48+dy} 46,${56+dy} 42,${68+dy} 42,${78+dy} 46,${90+dy}`, ...S }),
        el("line", { x1: 42, y1: 73 + dy, x2: 78, y2: 73 + dy, stroke: color, strokeWidth: C.strokeW, strokeLinecap: "round" }));
    case "tracker":
      return el("g", { transform: compact ? "scale(0.75) translate(18, 14)" : undefined },
        el("rect", { x: 35, y: 80 + dy, width: 12, height: 12, ...F }),
        el("rect", { x: 54, y: 80 + dy, width: 12, height: 12, ...F }),
        el("rect", { x: 73, y: 80 + dy, width: 12, height: 12, ...F }));
    case "pckg":
      return el("g", { transform: compact ? "scale(0.75) translate(18, 14)" : undefined },
        el("rect", { x: 34, y: 76 + dy, width: 28, height: 28, ...S }),
        el("polygon", { points: `34,${76+dy} 48,${64+dy} 76,${64+dy} 62,${76+dy}`, ...S }));
    case "nexus":
      return el("g", { transform: compact ? "scale(0.75) translate(18, 14)" : undefined },
        el("line", { x1: 40, y1: 98 + dy, x2: 60, y2: 78 + dy, stroke: color, strokeWidth: C.strokeW, strokeLinecap: "round" }),
        el("line", { x1: 60, y1: 78 + dy, x2: 80, y2: 98 + dy, stroke: color, strokeWidth: C.strokeW, strokeLinecap: "round" }),
        el("line", { x1: 40, y1: 98 + dy, x2: 80, y2: 98 + dy, stroke: color, strokeWidth: C.strokeW, strokeLinecap: "round" }),
        el("polygon", { points: `36,${98+dy} 40,${90+dy} 44,${98+dy} 40,${106+dy}`, ...F }),
        el("polygon", { points: `56,${78+dy} 60,${70+dy} 64,${78+dy} 60,${86+dy}`, ...F }),
        el("polygon", { points: `76,${98+dy} 80,${90+dy} 84,${98+dy} 80,${106+dy}`, ...F }));
  }
}

function svg(viewBox: string, w: number, h: number, ...children: any[]) {
  return el("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox, width: w, height: h }, ...children);
}

function BeskidIcon({ color = C.teal, flat = false, size = 120 }: { color?: string; flat?: boolean; size?: number }) {
  const s = size / 120;
  return svg(`0 0 ${size} ${size}`, size, size,
    el(Mountain, { color, flat, size }),
    s === 1
      ? el(Diamond, { color })
      : el("g", { transform: `scale(${s})` }, el(Diamond, { color })),
  );
}

function BeskidStacked({ color = C.teal, flat = false, dark = false }: { color?: string; flat?: boolean; dark?: boolean }) {
  const c = dark ? C.tealLight : color;
  return svg("0 0 200 180", 200, 180,
    dark && el("rect", { x: 0, y: 0, width: 200, height: 180, fill: C.bgDark }),
    el("g", { transform: "translate(40, 14) scale(0.583)" },
      el(Mountain, { color: c, flat }),
      el(Diamond, { color: c }),
    ),
    el(Wm, { color: c, x: 100, y: 162, size: 24 }),
  );
}

function BeskidHorizontal({ color = C.teal, flat = false }: { color?: string; flat?: boolean }) {
  return svg("0 0 280 80", 280, 80,
    el("g", { transform: "translate(8, 8) scale(0.533)" },
      el(Mountain, { color, flat }),
      el(Diamond, { color }),
    ),
    el(Wm, { color, x: 88, y: 50, size: 22, anchor: "start" }),
  );
}

function SvcIcon({ svc, color = C.teal, size = 120, flat = false }: { svc: ServiceId; color?: string; size?: number; flat?: boolean }) {
  const s = size / 120;
  return svg(`0 0 ${size} ${size}`, size, size,
    el(Mountain, { color, flat, size }),
    s === 1
      ? el(Accent, { svc, color })
      : el("g", { transform: `scale(${s})` }, el(Accent, { svc, color, compact: true })),
  );
}

function SvcLogo({ svc, label, color = C.teal, flat = false }: { svc: ServiceId; label: string; color?: string; flat?: boolean }) {
  return svg("0 0 200 140", 200, 140,
    el("g", { transform: "translate(40, 8) scale(0.583)" },
      el(Mountain, { color, flat }),
      el(Accent, { svc, color }),
    ),
    el(Wm, { color, x: 100, y: 118, text: label, size: 12, tracking: 2 }),
    el(Wm, { color, x: 100, y: 134, size: 9, tracking: 3 }),
  );
}

function SvcLogoHoriz({ svc, label, color = C.teal, flat = false }: { svc: ServiceId; label: string; color?: string; flat?: boolean }) {
  return svg("0 0 340 80", 340, 80,
    el("g", { transform: "translate(8, 8) scale(0.533)" },
      el(Mountain, { color, flat }),
      el(Accent, { svc, color }),
    ),
    el(Wm, { color, x: 88, y: 38, text: label, size: 13, tracking: 2, anchor: "start" }),
    el(Wm, { color, x: 88, y: 60, size: 11, tracking: 3, anchor: "start" }),
  );
}

function SvcIconWithText({ svc, color = C.teal, flat = false }: { svc: ServiceId; color?: string; flat?: boolean }) {
  const label = SERVICE_SHORT[svc];
  return svg("0 0 120 160", 120, 160,
    el("g", { transform: "translate(12, 4) scale(0.8)" },
      el(Mountain, { color, flat }),
      el(Accent, { svc, color, compact: true }),
    ),
    el(Wm, { color, x: 60, y: 132, text: label, size: 14, tracking: 2 }),
    el(Wm, { color, x: 60, y: 150, size: 9, tracking: 3 }),
  );
}

function toSvg(elem: any): string {
  return "<!DOCTYPE svg>\n" + renderToStaticMarkup(elem);
}
function write(path: string, elem: any) {
  writeFileSync(path, toSvg(elem) + "\n", "utf-8");
}

const ROOT = join(import.meta.dirname!, "..", "out");
try { rmSync(ROOT, { recursive: true }); } catch {}
mkdirSync(ROOT, { recursive: true });
console.log("Beskid Brand\n");

const L = join(ROOT, "logos");
mkdirSync(L);
console.log("Logos:");
write(join(L, "icon.svg"), el(BeskidIcon, {}));
write(join(L, "stacked.svg"), el(BeskidStacked, {}));
write(join(L, "horizontal.svg"), el(BeskidHorizontal, {}));
write(join(L, "dark.svg"), el(BeskidStacked, { dark: true }));
write(join(L, "icon-flat.svg"), el(BeskidIcon, { flat: true }));
write(join(L, "stacked-flat.svg"), el(BeskidStacked, { flat: true }));
write(join(L, "horizontal-flat.svg"), el(BeskidHorizontal, { flat: true }));
write(join(L, "dark-flat.svg"), el(BeskidStacked, { dark: true, flat: true }));

const SIZES = [24, 48, 64, 120, 256] as const;
for (const svc of SERVICES) {
  const dir = join(ROOT, svc);
  mkdirSync(dir);
  console.log(svc);
  const label = SERVICE_LABELS[svc];
  for (const size of SIZES) {
    const suffix = size === 120 ? "" : "-" + size;
    write(join(dir, "icon" + suffix + ".svg"), el(SvcIcon, { svc, size }));
  }
  write(join(dir, "icon-flat.svg"), el(SvcIcon, { svc, flat: true }));
  write(join(dir, "icon-text.svg"), el(SvcIconWithText, { svc }));
  write(join(dir, "logo.svg"), el(SvcLogo, { svc, label }));
  write(join(dir, "logo-horizontal.svg"), el(SvcLogoHoriz, { svc, label }));
  write(join(dir, "logo-flat.svg"), el(SvcLogo, { svc, label, flat: true }));
}

console.log("\nDone");
