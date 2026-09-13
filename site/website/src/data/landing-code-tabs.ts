import type { LandingCodeLang } from "./landing-tile-sections";

/** One tab in the hero code window, valid as a standalone playground source. */
export interface LandingCodeTab {
	file: string;
	lang?: LandingCodeLang;
	code: string;
	output?: string;
}

const calculatorCode = `// A small calculator that needs no project manifest or imports.
i32 Add(i32 left, i32 right) {
    return left + right;
}

i32 Main() {
    return Add(3, 4);
}
`;

const hostCode = `// Branches are ordinary expressions with explicit return types.
i32 IsEven(i32 value) {
    if value % 2 == 0 {
        return 1;
    }
    return 0;
}

i32 Main() {
    return IsEven(42);
}
`;

const codegenCode = `// Mutable values and loops compile in the standalone playground.
i32 SumTo(i32 limit) {
    mut i32 total = 0;
    mut i32 current = 1;
    while current <= limit {
        total = total + current;
        current = current + 1;
    }
    return total;
}

i32 Main() {
    return SumTo(5);
}
`;

export const landingCodeTabs: LandingCodeTab[] = [
	{ file: "calculator.bd", lang: "beskid", code: calculatorCode, output: "return value: 7" },
	{ file: "host.bd", lang: "beskid", code: hostCode },
	{ file: "codegen.bd", lang: "beskid", code: codegenCode },
];

/** Tab 1 carries terminal output; tabs 2 and 3 are code-only. */
export const landingCodeSplit = true;
