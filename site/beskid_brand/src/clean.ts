/** Delete only this package's known generated deliverables. */
import { rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { LOGO_VARIANTS, SERVICES } from "./lib/brand";

export const ARTIFACT_FILENAMES = [
	...LOGO_VARIANTS.map((variant) => `beskid-${variant}.svg`),
	...SERVICES.flatMap((service) => [
		`icon-${service}.svg`,
		...(["horizontal", "stacked", "dark"] as const).map((layout) => `service-${service}-${layout}.svg`),
	]),
	"beskid-icon-dark.svg", "beskid-icon-black.svg", "beskid-icon-white.svg",
	"beskid-logo-horizontal-dark.svg", "beskid-logo-horizontal-black.svg", "beskid-logo-horizontal-white.svg",
	"beskid-logo-wordmark.svg", "brand-preview.html",
	"beskid-logo-static.json", "beskid-logo-draw.json", "beskid-brand-kit.pdf",
];
export function CleanArtifacts(directory: string): void {
  for (const filename of ARTIFACT_FILENAMES) rmSync(join(directory, filename), { force: true });
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  CleanArtifacts(join(import.meta.dirname, ".."));
  console.log(`Cleaned ${ARTIFACT_FILENAMES.length} known artifact paths`);
}
