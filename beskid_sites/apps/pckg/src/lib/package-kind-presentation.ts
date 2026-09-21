import type { PackageKind } from "./pckg-api";

interface PackageInstructions {
	title: string;
	description: string;
	commands: string[];
}

export interface PackageKindPresentation {
	kind: PackageKind;
	badge: string;
	showDocumentation: boolean;
	instructions: PackageInstructions | null;
}

export function packageKindPresentation(input: {
	kind: PackageKind;
	packageName: string;
	latestVersion: string | null;
	templateShortName?: string | null;
}): PackageKindPresentation {
	switch (input.kind) {
		case "library":
			return {
				kind: input.kind,
				badge: "Library package",
				showDocumentation: true,
				instructions: null,
			};
		case "template":
			return {
				kind: input.kind,
				badge: "Template package",
				showDocumentation: false,
				instructions: {
					title: "Install this template",
					description:
						"Install the verified scaffold, then create a project from it.",
					commands: [
						`beskid new install ${input.packageName}`,
						...(input.templateShortName
							? [`beskid new ${input.templateShortName}`]
							: []),
					],
				},
			};
		case "tool":
			return {
				kind: input.kind,
				badge: "Tool package",
				showDocumentation: false,
				instructions: {
					title: "Install this tool",
					description: "Download the verified tool artifact from the registry.",
					commands: input.latestVersion
						? [
								`beskid pckg download ${input.packageName} --version ${input.latestVersion} --output ./${input.packageName}.bpk`,
							]
						: [],
				},
			};
	}

	throw new Error(`Unsupported package kind: ${String(input.kind)}`);
}
