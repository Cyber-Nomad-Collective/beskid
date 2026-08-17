import type { LandingCodeLang } from "./landing-tile-sections";

/**
 * One tab in the hero code window. Mirrors the `CodeTab` shape accepted by
 * `LandingCodeWindow.astro` (owned by the component slice). Kept as a local
 * interface so this data file does not import from an `.astro` component.
 */
export interface LandingCodeTab {
	file: string;
	lang?: LandingCodeLang;
	code: string;
	output?: string;
}

/**
 * Tab 1 — a small calculator that reads two integers from stdin and prints
 * their sum. Uses only real corelib signatures (verified against
 * `compiler/corelib/packages`):
 *   - `Core.Input.ReadLine()`  -> `Result<string, SyscallError>`
 *   - `Core.Output.Write(line)` / `Core.Output.WriteLine(line)` -> `unit`
 *   - `Core.String.Len(s)` -> `i64`, `Core.String.ByteAt(s, i)` -> `u8`,
 *     `Core.String.DigitChar(d)` -> `string`
 *   - `Result<T, E>` with `Result::Ok(v)` / `Result::Error(e)` and `match`.
 *
 * No string->int parser and no int->string formatter ship in corelib, so the
 * example carries compact inline helpers built on `ByteAt` (digit arithmetic
 * `b - 48`) and `DigitChar` — the same idioms `Core.Time` uses internally.
 */
const calculatorCode = `use Core.Input;
use Core.Output;
use Core.String;
use Core.Results;
use Core.Syscall.SyscallError;

// Parse a signed decimal integer. Returns 0 on empty or invalid input.
i64 ParseInt(string text) {
    i64 len = Core.String.Len(text);
    if len == 0 {
        return 0;
    }
    mut i64 i = 0;
    mut i64 sign = 1;
    u8 first = Core.String.ByteAt(text, 0);
    if first == 45 {
        sign = -1;
        i = 1;
    }
    mut i64 acc = 0;
    while i < len {
        u8 b = Core.String.ByteAt(text, i);
        if b < 48 || b > 57 {
            return 0;
        }
        acc = acc * 10 + (b - 48);
        i = i + 1;
    }
    return sign * acc;
}

// Format a signed integer as a decimal string.
string FormatInt(i64 value) {
    if value == 0 {
        return "0";
    }
    bool negative = value < 0;
    mut i64 remaining = value;
    if negative {
        remaining = -remaining;
    }
    mut string digits = "";
    while remaining > 0 {
        i64 digit = remaining % 10;
        digits = Core.String.DigitChar(digit) + digits;
        remaining = remaining / 10;
    }
    if negative {
        return "-" + digits;
    }
    return digits;
}

// Write a prompt and read one line from stdin.
string Prompt(string label) {
    Core.Output.Write(label);
    Result<string, SyscallError> line = Core.Input.ReadLine();
    return match line {
        Result::Ok(text) => text,
        Result::Error(_) => "",
    };
}

unit main() {
    string xs = Prompt("x: ");
    string ys = Prompt("y: ");
    i64 x = ParseInt(xs);
    i64 y = ParseInt(ys);
    i64 sum = x + y;
    Core.Output.WriteLine("sum = " + FormatInt(sum));
}
`;

const calculatorOutput = `x: 3
y: 4
sum = 7`;

/**
 * Tab 2 — host composition: declare a host, register services, run startup,
 * and launch. No runtime output pane.
 */
const hostCode = `// Declare a console host with a service registry and a startup hook.
host AppHost(string[] args) : ConsoleHost {
    registry {
        single SqlStorage for IStorage;
    }
    startup(IConfiguration config, IStorage[] storages) {
        for s in storages {
            s.Open(config);
        }
    }
}

unit main(string[] args) {
    launch AppHost(args);
}
`;

/**
 * Tab 3 — a compiler Mod: a typed generator that emits structured syntax
 * contributions, plus a module-level `extend type` item. No runtime output.
 */
const codegenCode = `// Mod generators return typed syntax edits — no AddSource("*.g.cs") text surgery.
pub type RepoGen : Beskid.Compiler.Collect.Generator {
    GeneratedSyntaxContribution Generate(GenerationRequest request) {
        // Query the snapshot, build typed items, and let the host merge them.
        return GeneratedSyntaxContribution {};
    }
}

// Contribution items live at module scope, e.g. extending an app-defined type.
extend type Order {
    pub unit EnsureRepository() {
    }
}
`;

export const landingCodeTabs: LandingCodeTab[] = [
	{
		file: "calculator.bd",
		lang: "beskid",
		code: calculatorCode,
		output: calculatorOutput,
	},
	{
		file: "host.bd",
		lang: "beskid",
		code: hostCode,
	},
	{
		file: "codegen.bd",
		lang: "beskid",
		code: codegenCode,
	},
];

/** Tab 1 carries terminal output; tabs 2 and 3 are code-only. */
export const landingCodeSplit = true;
