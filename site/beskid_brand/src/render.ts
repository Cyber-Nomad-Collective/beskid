import { readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { beskidCoreIcon, SERVICE_ICONS } from "./components/icons";
import { LOGOS } from "./components/logos";
import {
	mergedServiceDark,
	mergedServiceHorizontal,
	mergedServiceStacked,
} from "./components/service-logos";
import { C, SERVICES } from "./lib/brand";
import { renderIcon } from "./lib/svg";

const OUT = join(import.meta.dirname!, "..");
try {
	for (const f of readdirSync(OUT).filter((f: string) => f.endsWith(".svg")))
		rmSync(join(OUT, f), { force: true });
} catch (_) {}
function w(n: string, s: string): void {
	writeFileSync(join(OUT, n), s, "utf-8");
	console.log(`  ${n}`);
}

console.log("\nLogos:");
for (const [v, fn] of Object.entries(LOGOS)) {
	const c = v === "logo-dark" ? C.tealLight : C.tealLight;
	w(`beskid-${v}.svg`, renderIcon((fn as any)(c)));
}

w("icon-beskid-core.svg", renderIcon(beskidCoreIcon(C.tealLight)));

console.log("\nService icons:");
for (const s of SERVICES) {
	if (s === "beskid-core") continue;
	w(`icon-${s}.svg`, renderIcon(SERVICE_ICONS[s](C.tealLight)));
}

console.log("\nMerged service logos:");
for (const s of SERVICES) {
	w(`service-${s}-horizontal.svg`, renderIcon(mergedServiceHorizontal(s)));
	w(`service-${s}-stacked.svg`, renderIcon(mergedServiceStacked(s)));
	w(`service-${s}-dark.svg`, renderIcon(mergedServiceDark(s)));
}
console.log("\nDone.");
