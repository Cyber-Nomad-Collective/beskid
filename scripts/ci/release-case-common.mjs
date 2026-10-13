// Shared vocabulary of the v0.6 release case matrix: canonical manifest bytes, flat packet names,
// command templates, retained raw-output parsing and the deterministic input archive. The reader
// (woodpecker-release-evidence.mjs), the producer (woodpecker-release-cases-v06.mjs) and the freeze
// tool (freeze-release-cases-v06.mjs) import these so they cannot drift apart.
import { createHash } from "node:crypto";
import { existsSync, lstatSync, readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

export const SHA256 = /^[a-f0-9]{64}$/;
export const EXECUTION_KINDS = ["installed_native", "installed_host_harness"];
export const HARNESS_LANGUAGES = { installed_native: "beskid", installed_host_harness: "rust" };
export const INVOCATION_LINE = /^beskid-installed-invocation sha256=([a-f0-9]{64}) argv0=([A-Za-z0-9._-]+)$/;
export const SECTION_BEGIN = /^beskid-release-case begin test=([A-Za-z0-9_:.-]+)$/;
export const SECTION_END = /^beskid-release-case end test=([A-Za-z0-9_:.-]+) exit=(-?\d+|signal) timed_out=(true|false)$/;
export const OUTPUT_LIMIT = 8 * 1024 * 1024;
export const TEMPLATE_KEYS = ["installed_cli", "installed_prefix", "installed_corelib", "harness", "fixture", "input_root"];
export const RUST_TEST_ID = /^[A-Za-z_][A-Za-z0-9_]*$/;
export const BESKID_TEST_ID = /^[A-Za-z_][A-Za-z0-9_]*$/;

export function fail(message) {
  throw new Error(message);
}

export function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

/** Sort object keys recursively; arrays keep their order. */
export function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonicalize(value[key])]));
  }
  return value;
}

/** The only byte form a frozen manifest may take: sorted keys, two-space indent, one final LF. */
export function CanonicalManifestBytes(manifest) {
  return Buffer.from(`${JSON.stringify(canonicalize(manifest), null, 2)}\n`, "utf8");
}

export function ManifestDigest(bytes) {
  if (!Buffer.isBuffer(bytes)) fail("manifest digest requires the manifest bytes");
  return sha256(bytes);
}

/** Parse manifest bytes and require that they are canonical; returns the parsed object. */
export function ParseCanonicalManifest(bytes) {
  let parsed;
  try {
    parsed = JSON.parse(bytes.toString("utf8"));
  } catch (error) {
    fail(`case manifest is not valid JSON: ${error.message}`);
  }
  if (!Buffer.from(CanonicalManifestBytes(parsed)).equals(bytes)) fail("case manifest bytes are not canonical JSON");
  return parsed;
}

export function packetName(name) {
  if (typeof name !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(name)) fail(`packet file name must be confined and flat: ${name}`);
  return name;
}

/** A relative path confined below its root: no absolute form, no `..`, no empty segment. */
export function confinedRelativePath(path, label) {
  if (typeof path !== "string" || path.length === 0) fail(`${label} must be a relative path`);
  const segments = path.split(/[\\/]/);
  if (segments.some(segment => segment === "" || segment === "." || segment === "..") || /^[A-Za-z]:/.test(path)) fail(`${label} must be a confined relative path`);
  return segments;
}

export function pathSegments(path) {
  return path.split(/[\\/]+/).filter((segment, index) => segment.length > 0 || index === 0);
}

export function samePathSegments(left, right) {
  const a = pathSegments(left), b = pathSegments(right);
  return a.length === b.length && a.every((segment, index) => segment === b[index]);
}

export function sourcePacketName(sourceFile) {
  const segments = confinedRelativePath(sourceFile, "binding source_file");
  if (segments.length < 2) fail(`source_file needs a parent directory: ${sourceFile}`);
  return packetName(`source-${segments[segments.length - 2]}-${segments[segments.length - 1]}`);
}

export function inputPacketName(id) {
  return packetName(`input-${id}.tar`);
}

export function caseLogName(id) {
  return packetName(`case-${id}.json`);
}
export function caseStdoutName(id) {
  return packetName(`stdout-${id}.log`);
}
export function caseStderrName(id) {
  return packetName(`stderr-${id}.log`);
}
export const INSTALLED_RECEIPT = "installed-prefix.json";
export const RUNTIME_KIT_RECEIPT = "runtime-kit.json";
export const RUNTIME_ABI_RECEIPT = "runtime-abi.json";
export const CORELIB_FINGERPRINT_FILE = "installed-corelib-fingerprint.txt";
export const MANIFEST_FILE = "release-cases-v06.json";
export const FEATURE_FILE = "feature-evidence-v2.json";

export function harnessPacketName(harness, target) {
  return packetName(`harness-${harness}${target.includes("windows") ? ".exe" : ""}`);
}
export function fixturePacketName(fixture, target) {
  return packetName(`fixture-${fixture}${target.includes("windows") ? ".exe" : ""}`);
}

/** Replace `{key}` templates in one argv/env string; unknown templates fail closed. */
export function substituteTemplate(text, values) {
  return text.replace(/\{([a-z_]+)\}/g, (whole, key) => {
    if (key === "test_id") return whole;
    if (!TEMPLATE_KEYS.includes(key)) fail(`unknown command template {${key}}`);
    if (typeof values[key] !== "string" || values[key].length === 0) fail(`command template {${key}} has no value`);
    return values[key];
  });
}

export function substituteCommand(command, values) {
  return {
    ...command,
    argv: command.argv.map(argument => substituteTemplate(argument, values)),
    tool_file: substituteTemplate(command.tool_file, values),
    env: Object.fromEntries(Object.entries(command.env ?? {}).map(([key, value]) => [key, substituteTemplate(value, values)])),
  };
}

/**
 * The libtest name of one Rust declaration: the module path of its source file inside the harness
 * crate (`tests/<module>.rs` of the single test target, or `src/<path>.rs` of a lib target) plus the
 * function name. `main.rs`, `lib.rs` and `mod.rs` contribute no segment.
 */
export function libtestPath(sourceFile, sourceRoot, testId) {
  const root = confinedRelativePath(sourceRoot, "harness source_root").join("/");
  const file = confinedRelativePath(sourceFile, "binding source_file").join("/");
  if (!file.startsWith(`${root}/`)) fail(`harness source ${sourceFile} is outside the harness crate ${sourceRoot}`);
  const segments = file.slice(root.length + 1).split("/");
  const top = segments.shift();
  if (!["tests", "src"].includes(top) || !segments.length) fail(`harness source ${sourceFile} must live under tests/ or src/ of ${sourceRoot}`);
  let last = segments.pop();
  if (!last.endsWith(".rs")) fail(`harness source ${sourceFile} must be a Rust file`);
  last = last.slice(0, -3);
  if (!["main", "lib", "mod"].includes(last)) segments.push(last);
  return [...segments, testId].join("::");
}

/** Beskid declaration grammar: `test <id>` at a line start followed by `{`. */
export function findBeskidDeclaration(source, testId) {
  if (!BESKID_TEST_ID.test(testId)) fail(`native assertion identifier is invalid: ${testId}`);
  const declaration = Buffer.from(`test ${testId}`);
  const matches = [];
  let offset = 0;
  while (true) {
    const start = source.indexOf(declaration, offset);
    if (start < 0) break;
    offset = start + 1;
    if (start !== 0 && source[start - 1] !== 10) continue;
    if (!/^\s*\{/.test(source.subarray(start + declaration.length, start + declaration.length + 64).toString("utf8"))) continue;
    matches.push({ start, end: start + declaration.length, declaration: declaration.toString("utf8") });
  }
  return matches;
}

/**
 * Rust declaration grammar: a line `#[test]` directly followed by a line `fn <id>(` with equal
 * leading whitespace; no attribute (such as `#[ignore]` or `#[should_panic]`) may sit between
 * them. Returns every match so duplicates can be rejected.
 */
export function findRustDeclaration(source, testId) {
  if (!RUST_TEST_ID.test(testId)) fail(`Rust assertion identifier is invalid: ${testId}`);
  const text = source.toString("utf8");
  const pattern = new RegExp(`(^|\\n)([ \\t]*)#\\[test\\]\\r?\\n\\2(fn ${testId}\\()`, "g");
  const matches = [];
  for (const match of text.matchAll(pattern)) {
    const prefix = match[0].length - match[3].length;
    const start = Buffer.byteLength(text.slice(0, match.index + prefix));
    matches.push({ start, end: start + Buffer.byteLength(match[3]), declaration: match[3] });
  }
  return matches;
}

export function findDeclaration(language, source, testId) {
  if (language === "beskid") return findBeskidDeclaration(source, testId);
  if (language === "rust") return findRustDeclaration(source, testId);
  fail(`assertion declaration language missing or unsupported: ${language}`);
}

/** Verify one provenance entry against retained source bytes. */
export function checkProvenance(language, source, proof, requiredIds, label) {
  if (!proof || typeof proof !== "object") fail(`${label} assertion provenance entry invalid`);
  if (!requiredIds.includes(proof.test_id)) fail(`${label} assertion provenance identity mismatch`);
  const matches = findDeclaration(language, source, proof.test_id);
  if (matches.length !== 1) fail(`${label} assertion declaration for ${proof.test_id} is missing or duplicated`);
  const [match] = matches;
  if (!Number.isSafeInteger(proof.start) || !Number.isSafeInteger(proof.end) || proof.start !== match.start
      || proof.end !== match.end || proof.declaration !== match.declaration
      || source.subarray(proof.start, proof.end).toString("utf8") !== proof.declaration) fail(`${label} assertion declaration provenance mismatch`);
}

/** Split retained raw output into per-test sections written by the producer around each process. */
export function parseSections(text, label) {
  const lines = text.split("\n");
  const sections = new Map();
  let current = null;
  for (const raw of lines) {
    const line = raw.endsWith("\r") ? raw.slice(0, -1) : raw;
    const begin = SECTION_BEGIN.exec(line);
    const end = SECTION_END.exec(line);
    if (begin) {
      if (current) fail(`${label} retained output nests sections`);
      if (sections.has(begin[1])) fail(`${label} retained output repeats section ${begin[1]}`);
      current = { id: begin[1], lines: [] };
    } else if (end) {
      if (!current || current.id !== end[1]) fail(`${label} retained output section end without begin`);
      sections.set(current.id, { lines: current.lines, exit_code: end[2] === "signal" ? null : Number(end[2]), timed_out: end[3] === "true" });
      current = null;
    } else if (current) {
      current.lines.push(line);
    } else if (line.length > 0) {
      fail(`${label} retained output has bytes outside a section`);
    }
  }
  if (current) fail(`${label} retained output section is unterminated`);
  return sections;
}

/** Derive the executed outcome of one libtest `--exact <id>` run from its raw stdout lines. */
export function libtestOutcome(lines, testId) {
  const text = lines.join("\n");
  if (/^running 0 tests$/m.test(text)) return "not_executed";
  const running = text.match(/^running (\d+) tests?$/mg) ?? [];
  if (running.length !== 1 || running[0] !== "running 1 test") return "not_executed";
  const ok = new RegExp(`^test ${testId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} \\.\\.\\. ok$`, "m").test(text);
  const failed = /^test .* \.\.\. (FAILED|ignored)$/m.test(text) || /^failures:$/m.test(text);
  const result = /^test result: (ok|FAILED)\. (\d+) passed; (\d+) failed; (\d+) ignored; (\d+) measured; (\d+) filtered out/m.exec(text);
  if (!result || failed) return "failed";
  if (result[1] !== "ok" || result[2] !== "1" || result[3] !== "0" || result[4] !== "0") return "failed";
  return ok ? "passed" : "not_executed";
}

/** Parse a raw `beskid test --json` report and return the passed qualified names, failing closed. */
export function nativeReportOutcomes(bytes, target, label) {
  let report;
  try {
    report = JSON.parse(bytes.toString("utf8"));
  } catch {
    fail(`${label} retained stdout is not a beskid test JSON report`);
  }
  if (!report || typeof report !== "object" || report.target !== target || !Array.isArray(report.tests)) fail(`${label} test report target or tests are invalid`);
  const summary = report.summary;
  if (summary === null || Array.isArray(summary) || typeof summary !== "object") fail(`${label} summary is missing or invalid`);
  const outcomes = { passed: 0, failed: 0, skipped: 0, filtered_out: 0, timed_out: 0 };
  const names = new Set();
  for (const test of report.tests) {
    if (!test || typeof test !== "object" || !Object.hasOwn(outcomes, test.outcome) || typeof test.qualified_name !== "string" || !test.qualified_name) fail(`${label} contains an invalid test record`);
    if (names.has(test.qualified_name)) fail(`${label} duplicate executed assertion ${test.qualified_name}`);
    names.add(test.qualified_name);
    outcomes[test.outcome] += 1;
  }
  const summaryKeys = Object.keys(summary).sort();
  if (summaryKeys.join(",") !== Object.keys(outcomes).sort().join(",")) fail(`${label} summary keys differ`);
  for (const [name, count] of Object.entries(outcomes)) {
    if (!Number.isSafeInteger(summary[name]) || summary[name] !== count) fail(`${label} summary counts do not match tests`);
  }
  if (report.tests.length === 0 || outcomes.passed === 0 || outcomes.failed + outcomes.skipped + outcomes.filtered_out + outcomes.timed_out > 0) {
    fail(`${label} contains skipped, filtered, timed-out, or failed tests`);
  }
  return report.tests.map(test => test.qualified_name);
}

// --- deterministic input archive (ustar, mtime 0, uid/gid 0, sorted) -------------------------

function octal(value, width) {
  return value.toString(8).padStart(width - 1, "0") + "\0";
}

function header(name, size, mode, type) {
  const block = Buffer.alloc(512);
  if (Buffer.byteLength(name) > 100) fail(`archive entry name too long: ${name}`);
  block.write(name, 0, "utf8");
  block.write(octal(mode, 8), 100);
  block.write(octal(0, 8), 108);
  block.write(octal(0, 8), 116);
  block.write(octal(size, 12), 124);
  block.write(octal(0, 12), 136);
  block.write("        ", 148);
  block.write(type, 156);
  block.write("ustar\0", 257);
  block.write("00", 263);
  let sum = 0;
  for (const byte of block) sum += byte;
  block.write(sum.toString(8).padStart(6, "0") + "\0 ", 148);
  return block;
}

/** Archive a directory tree deterministically; symbolic links and special files are rejected.
 * `include`, when given, names the only top-level directories of `root` that enter the archive. */
export function DeterministicArchive(root, include = null) {
  const entries = [];
  function visit(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)) {
      const full = join(directory, entry.name);
      const name = relative(root, full).split(/[\\/]/).join("/");
      if (entry.isSymbolicLink()) fail(`archive input contains a symbolic link: ${name}`);
      if (entry.isDirectory()) {
        entries.push(header(`${name}/`, 0, 0o755, "5"));
        visit(full);
      } else if (entry.isFile()) {
        const bytes = readFileSync(full);
        const executable = (lstatSync(full).mode & 0o111) !== 0;
        entries.push(header(name, bytes.length, executable ? 0o755 : 0o644, "0"), bytes);
        const padding = (512 - (bytes.length % 512)) % 512;
        if (padding) entries.push(Buffer.alloc(padding));
      } else {
        fail(`archive input contains an unsupported entry: ${name}`);
      }
    }
  }
  const stat = lstatSync(root);
  if (stat.isSymbolicLink() || !stat.isDirectory()) fail(`archive input must be a real directory: ${root}`);
  if (include === null) {
    visit(root);
  } else {
    for (const name of [...include].sort((a, b) => a < b ? -1 : a > b ? 1 : 0)) {
      const full = join(root, name);
      const child = existsSync(full) ? lstatSync(full) : null;
      if (!child || child.isSymbolicLink() || !child.isDirectory()) fail(`archive input ${name} must be a real directory of ${root}`);
      entries.push(header(`${name}/`, 0, 0o755, "5"));
      visit(full);
    }
  }
  entries.push(Buffer.alloc(1024));
  return Buffer.concat(entries);
}

/** Validated release-case input: `include` names the archived top-level directories of `source_root`,
 * and `corpus` the one of them exposed to the test process as `BESKID_BSOL_CORPUS`. */
export function InputSpec(input, label) {
  if (!input || typeof input !== "object") fail(`${label} must be an object`);
  if (Object.keys(input).sort().join(",") !== "corpus,id,include,source_root") fail(`${label} must name exactly id, source_root, include and corpus`);
  if (typeof input.id !== "string" || !/^[a-z0-9-]+$/.test(input.id)) fail(`${label} id must be a flat lowercase name`);
  confinedRelativePath(input.source_root, `${label} source_root`);
  if (!Array.isArray(input.include) || !input.include.length || new Set(input.include).size !== input.include.length
      || input.include.some(name => typeof name !== "string" || !/^[A-Za-z0-9_.-]+$/.test(name) || name === "." || name === "..")) {
    fail(`${label} include must be unique flat directory names`);
  }
  if (!input.include.includes(input.corpus)) fail(`${label} corpus must be one of its include directories`);
  return { id: input.id, source_root: input.source_root, include: [...input.include].sort(), corpus: input.corpus };
}

/** The deterministic archive of one frozen or fragment input, read from the checkout. */
export function InputArchive(repo, input) {
  return DeterministicArchive(join(repo, input.source_root), input.include);
}
