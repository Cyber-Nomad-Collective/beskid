import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import { lstatSync, readFileSync, readdirSync } from "node:fs";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { checkSource, parsePublicationHolds } from "./release-publication-eligibility.mjs";

const SHA256 = /^[a-f0-9]{64}$/;
const COMMIT = /^[a-f0-9]{40}$/;
const STABLE_VERSION = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/;
const SAFE_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const IMAGE = /^[a-z0-9][a-z0-9._/:@-]*@sha256:[a-f0-9]{64}$/;
export const REQUIRED_GREEN_CHECKS = ["clang", "cc", "ar", "ranlib", "libc-header-c-probe", "analyze", "locked-build", "locked-run", "lockfile-unchanged"];
const TARGETS = new Map([
  ["x86_64-unknown-linux-gnu", { debian: "amd64", kernel: "x86_64" }],
]);
const PUBLICATION_HOLDS = new URL("./release-publication-holds.json", import.meta.url);
const PUBLICATION_HOLDS_PATH = fileURLToPath(PUBLICATION_HOLDS);

function Fail(message) { throw new Error(message); }
function ObjectValue(value, label) {
  if (value === null || Array.isArray(value) || typeof value !== "object") Fail(`${label} must be an object`);
  return value;
}
function ExactKeys(value, expected, label) {
  ObjectValue(value, label);
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) Fail(`${label} must contain exactly ${wanted.join(", ")}`);
}
function StringValue(value, label, pattern) {
  if (typeof value !== "string" || value.length === 0 || (pattern && !pattern.test(value))) Fail(`${label} is invalid`);
  return value;
}
function Sha256(value, label) { return StringValue(value, label, SHA256); }
function Commit(value, label) { return StringValue(value, label, COMMIT); }
function SafeName(value, label) {
  StringValue(value, label, SAFE_NAME);
  if (value === "." || value === "..") Fail(`${label} is invalid`);
  return value;
}
function SafeRelativePath(value, label) {
  StringValue(value, label);
  if (isAbsolute(value) || value.includes("\\") || value.split("/").some(part => part === "" || part === "." || part === ".." || !SAFE_NAME.test(part))) {
    Fail(`${label} must be a safe relative path`);
  }
  return value;
}

function RequireNoSymlinkAncestors(path, label) {
  const chain = [];
  let current = dirname(resolve(path));
  while (current !== dirname(current)) {
    chain.push(current);
    current = dirname(current);
  }
  for (const ancestor of chain.reverse()) {
    let stats;
    try { stats = lstatSync(ancestor); } catch { Fail(`${label} ancestor is missing`); }
    if (stats.isSymbolicLink()) Fail(`${label} ancestor must not be a symbolic link`);
    if (!stats.isDirectory()) Fail(`${label} ancestor must be a directory`);
  }
}

export function RequireDirectory(path, label) {
  RequireNoSymlinkAncestors(path, label);
  let stats;
  try { stats = lstatSync(path); } catch { Fail(`${label} is missing`); }
  if (stats.isSymbolicLink()) Fail(`${label} must not be a symbolic link`);
  if (!stats.isDirectory()) Fail(`${label} must be a directory`);
  return path;
}

export function RequireRegularFile(path, label) {
  RequireNoSymlinkAncestors(path, label);
  let stats;
  try { stats = lstatSync(path); } catch { Fail(`${label} is missing`); }
  if (stats.isSymbolicLink()) Fail(`${label} must not be a symbolic link`);
  if (!stats.isFile()) Fail(`${label} must be a regular file`);
  return path;
}

export function RequireContainedRegularFile(root, relativePath, label) {
  RequireDirectory(root, `${label} root`);
  SafeRelativePath(relativePath, `${label} path`);
  let current = root;
  const parts = relativePath.split("/");
  for (const [index, part] of parts.entries()) {
    current = join(current, part);
    if (index === parts.length - 1) RequireRegularFile(current, label);
    else RequireDirectory(current, `${label} parent ${parts.slice(0, index + 1).join("/")}`);
  }
  const fromRoot = relative(root, current);
  if (fromRoot.startsWith(`..${sep}`) || fromRoot === ".." || isAbsolute(fromRoot)) Fail(`${label} escapes its root`);
  return current;
}

export function Digest(path, label) {
  RequireRegularFile(path, label);
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

export function ReadJson(path, label) {
  RequireRegularFile(path, label);
  try { return ObjectValue(JSON.parse(readFileSync(path, "utf8")), label); }
  catch (error) { Fail(`${label} is invalid JSON: ${error.message}`); }
}

export function AssertInventory(directory, expected, label) {
  RequireDirectory(directory, label);
  const actual = readdirSync(directory).sort();
  const wanted = [...expected].sort();
  if (!isDeepStrictEqual(actual, wanted)) Fail(`${label} inventory must contain exactly ${wanted.join(", ")}`);
}

function FileBinding(value, label) {
  ExactKeys(value, ["path", "sha256"], label);
  SafeRelativePath(value.path, `${label} path`);
  Sha256(value.sha256, `${label} SHA-256`);
}

export function ReadCorrectionIntent(path) {
  const value = ReadJson(path, "correction intent");
  ExactKeys(value, ["schema_version", "kind", "version", "platform", "target", "native", "recipe", "artifact", "record", "qualification"], "correction intent");
  if (!Number.isSafeInteger(value.schema_version) || value.schema_version !== 1) Fail("correction intent schema_version must be the integer 1");
  if (value.kind !== "linux-package-derivative-correction" || value.platform !== "linux") Fail("correction intent has unsupported identity");
  StringValue(value.version, "intent version", STABLE_VERSION);
  StringValue(value.target, "intent target");
  const target = TARGETS.get(value.target);
  if (!target) Fail("intent target is unsupported");

  ExactKeys(value.native, ["superrepo_commit", "compiler_commit", "bundle", "release_state_sha256", "validated_evidence_sha256"], "intent native");
  Commit(value.native.superrepo_commit, "intent native superrepo commit");
  Commit(value.native.compiler_commit, "intent native compiler commit");
  RequireRegularFile(PUBLICATION_HOLDS_PATH, "publication hold policy");
  checkSource(value.version, value.native.compiler_commit, parsePublicationHolds(readFileSync(PUBLICATION_HOLDS_PATH, "utf8")));
  ExactKeys(value.native.bundle, ["name", "sha256"], "intent native bundle");
  SafeName(value.native.bundle.name, "intent bundle name");
  Sha256(value.native.bundle.sha256, "intent bundle SHA-256");
  Sha256(value.native.release_state_sha256, "intent release-state SHA-256");
  Sha256(value.native.validated_evidence_sha256, "intent validated-evidence SHA-256");
  if (value.native.bundle.name !== `beskid-${value.version}-${value.target}.tar.gz`) Fail("intent bundle name does not match version and target");

  ExactKeys(value.recipe, ["distribution_commit", "base_distribution_commit", "entrypoint"], "intent recipe");
  Commit(value.recipe.distribution_commit, "intent recipe distribution commit");
  Commit(value.recipe.base_distribution_commit, "intent recipe base distribution commit");
  SafeRelativePath(value.recipe.entrypoint, "intent recipe entrypoint");

  ExactKeys(value.artifact, ["name", "sha256"], "intent artifact");
  SafeName(value.artifact.name, "intent artifact name");
  Sha256(value.artifact.sha256, "intent artifact SHA-256");
  if (value.artifact.name !== `beskid-${value.version}-${target.debian}.deb`) Fail("intent artifact name does not match version and target architecture");
  ExactKeys(value.record, ["name"], "intent record");
  SafeName(value.record.name, "intent record name");
  if (!new RegExp(`^${Escape(value.artifact.name)}\\.correction-v[1-9][0-9]*\\.json$`).test(value.record.name)) Fail("intent record name does not match artifact name");

  ExactKeys(value.qualification, ["environment", "harness", "fixture", "red", "green"], "intent qualification");
  const environment = value.qualification.environment;
  ExactKeys(environment, ["os", "version", "architecture", "install_mode", "container_image"], "intent qualification environment");
  StringValue(environment.os, "qualification OS", SAFE_NAME);
  StringValue(environment.version, "qualification OS version", SAFE_NAME);
  StringValue(environment.architecture, "qualification architecture", SAFE_NAME);
  if (environment.architecture !== target.debian) Fail("qualification architecture does not match target architecture");
  if (environment.install_mode !== "apt-get --no-install-recommends") Fail("qualification install mode is invalid");
  StringValue(environment.container_image, "qualification container image", IMAGE);
  FileBinding(value.qualification.harness, "intent qualification harness");
  ExactKeys(value.qualification.fixture, ["project", "source", "c_probe"], "intent qualification fixture");
  FileBinding(value.qualification.fixture.project, "intent qualification fixture project");
  FileBinding(value.qualification.fixture.source, "intent qualification fixture source");
  FileBinding(value.qualification.fixture.c_probe, "intent qualification fixture c_probe");
  if (basename(value.qualification.fixture.project.path) !== "Smoke.bproj") Fail("qualification project fixture must be Smoke.bproj");

  ExactKeys(value.qualification.red, ["log", "sha256", "expected_failure", "exit_code"], "intent RED");
  ExactKeys(value.qualification.green, ["log", "sha256", "required_checks", "exit_code"], "intent GREEN");
  for (const [label, part] of [["RED", value.qualification.red], ["GREEN", value.qualification.green]]) {
    SafeName(part.log, `intent ${label} log`);
    Sha256(part.sha256, `intent ${label} log SHA-256`);
    if (!Number.isSafeInteger(part.exit_code)) Fail(`intent ${label} exit_code must be a finite safe integer`);
  }
  if (value.qualification.red.log === value.qualification.green.log) Fail("qualification RED and GREEN logs must have different names");
  StringValue(value.qualification.red.expected_failure, "intent RED expected failure");
  if (value.qualification.red.expected_failure.includes("\n") || value.qualification.red.exit_code !== 1) Fail("intent RED expectation is invalid");
  if (value.qualification.green.exit_code !== 0) Fail("intent GREEN exit code must be zero");
  if (!Array.isArray(value.qualification.green.required_checks) || !isDeepStrictEqual(value.qualification.green.required_checks, REQUIRED_GREEN_CHECKS)) {
    Fail("GREEN required checks must contain the complete ordered finite check set");
  }
  return value;
}

function Escape(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
function Has(text, pattern, message) { if (!pattern.test(text)) Fail(message); }

export function ValidateQualificationLogs(definition, redPath, greenPath) {
  if (Digest(redPath, "RED qualification evidence") !== definition.qualification.red.sha256) Fail("RED qualification evidence digest does not match intent");
  if (Digest(greenPath, "GREEN qualification evidence") !== definition.qualification.green.sha256) Fail("GREEN qualification evidence digest does not match intent");
  const red = readFileSync(redPath, "utf8"), green = readFileSync(greenPath, "utf8");
  const environment = definition.qualification.environment, harness = definition.qualification.harness;
  const start = phase => new RegExp(`^QUALIFICATION_START phase=${phase} image=${Escape(environment.container_image)} harness_sha256=${harness.sha256}$`, "m");
  Has(red, start("red"), "RED qualification trace has the wrong phase, image, or harness binding");
  Has(green, start("green"), "GREEN qualification trace has the wrong phase, image, or harness binding");
  Has(red, /^\+ set -euo pipefail$/m, "RED qualification trace lacks strict harness execution");
  Has(green, /^\+ set -euo pipefail$/m, "GREEN qualification trace lacks strict harness execution");
  Has(red, new RegExp(`^QUALIFICATION_EXIT phase=red exit_code=${definition.qualification.red.exit_code}$`, "m"), "RED qualification trace has the wrong exit status");
  Has(green, new RegExp(`^QUALIFICATION_EXIT phase=green exit_code=${definition.qualification.green.exit_code}$`, "m"), "GREEN qualification trace has the wrong exit status");
  if (!red.includes(definition.qualification.red.expected_failure)) Fail("RED qualification evidence lacks the expected failure");
  const packageName = Escape(definition.artifact.name);
  Has(red, new RegExp(`^\\+ apt-get install -y --no-install-recommends /input/${packageName}$`, "m"), "RED qualification trace lacks the required install mode");
  Has(green, new RegExp(`^\\+ apt-get install -y --no-install-recommends /input/${packageName}$`, "m"), "GREEN qualification trace lacks the required install mode");
  const target = TARGETS.get(definition.target);
  const markers = {
    clang: /^\+ command -v clang\r?\n\/usr\/bin\/clang$/m,
    cc: /^\+ command -v cc\r?\n\/usr\/bin\/cc$/m,
    ar: /^\+ command -v ar\r?\n\/usr\/bin\/ar$/m,
    ranlib: /^\+ command -v ranlib\r?\n\/usr\/bin\/ranlib$/m,
    "libc-header-c-probe": new RegExp(`^\\+ clang -target ${Escape(definition.target)} -std=c11 -fPIC -c .+/probe\\.c -o .+/probe\\.o$[\\s\\S]*^\\+ ar rcs .+/probe\\.a .+/probe\\.o$[\\s\\S]*^\\+ ranlib .+/probe\\.a$[\\s\\S]*^\\+ cc .+/probe\\.a -o .+/probe$[\\s\\S]*^\\+ .+/probe$`, "m"),
    analyze: /^\+ \/usr\/bin\/beskid analyze --project Smoke\.bproj --plain$/m,
    "locked-build": /^\+ \/usr\/bin\/beskid build --project Smoke\.bproj --locked --plain$/m,
    "locked-run": /^\+ \/usr\/bin\/beskid run --project Smoke\.bproj --locked --plain$[\s\S]*^Run complete in .+$[\s\S]*^\s*exit:\s*0$/m,
    "lockfile-unchanged": /^\+ sha256sum Project\.lock$[\s\S]*^\+ sha256sum --check .+\/lock\.sha256$[\s\S]*^Project\.lock: OK$/m,
  };
  Has(green, new RegExp(`^\\+ \\[\\[ ${Escape(environment.os)} == ${Escape(environment.os)} \\]\\]$`, "m"), "GREEN qualification trace does not bind the operating system");
  Has(green, new RegExp(`^\\+ \\[\\[ ${Escape(environment.version)} == ${Escape(environment.version)} \\]\\]$`, "m"), "GREEN qualification trace does not bind the operating-system version");
  Has(green, new RegExp(`^\\+ \\[\\[ ${target.kernel} == ${target.kernel} \\]\\]$`, "m"), "GREEN qualification trace does not bind the target architecture");
  Has(green, new RegExp(`^\\+ cp /test/${Escape(definition.qualification.fixture.c_probe.path)} .+/probe\\.c$`, "m"), "GREEN qualification trace does not consume the pinned C probe fixture");
  Has(green, new RegExp(`^\\+ cp -a /test/${Escape(dirname(definition.qualification.fixture.project.path))}/\\. .+/project/$`, "m"), "GREEN qualification trace does not consume the pinned project fixture");
  for (const check of definition.qualification.green.required_checks) Has(green, markers[check], `GREEN qualification evidence lacks required assertion: ${check}`);
  Has(green, /^Clean DEB toolchain install and AOT build\/run: PASS$/m, "GREEN qualification evidence lacks the terminal success assertion");
}

export function CorrectionRecord(definition) {
  return { schema_version: 1, kind: definition.kind, version: definition.version, platform: definition.platform, target: definition.target,
    native: definition.native, recipe: definition.recipe, artifact: definition.artifact, qualification: definition.qualification };
}

export function ValidateCorrectionOutput(intentPath, directory) {
  const resolvedIntent = resolve(intentPath);
  RequireDirectory(dirname(resolvedIntent), "correction intent parent");
  const definition = ReadCorrectionIntent(resolvedIntent);
  const root = resolve(directory);
  AssertInventory(root, [definition.artifact.name, definition.record.name, "correction-intent.json", "qualification"], "correction output");
  AssertInventory(join(root, "qualification"), [definition.qualification.red.log, definition.qualification.green.log], "correction qualification output");
  if ((lstatSync(root).mode & 0o777) !== 0o700) Fail("correction output must have mode 0700");
  const artifact = RequireContainedRegularFile(root, definition.artifact.name, "correction output DEB");
  const recordPath = RequireContainedRegularFile(root, definition.record.name, "correction output record");
  const intentCopyPath = RequireContainedRegularFile(root, "correction-intent.json", "correction output intent");
  const redPath = RequireContainedRegularFile(root, `qualification/${definition.qualification.red.log}`, "correction output RED evidence");
  const greenPath = RequireContainedRegularFile(root, `qualification/${definition.qualification.green.log}`, "correction output GREEN evidence");
  if (Digest(artifact, "correction output DEB") !== definition.artifact.sha256) Fail("correction output DEB digest does not match intent");
  const copiedIntent = ReadCorrectionIntent(intentCopyPath);
  if (!isDeepStrictEqual(copiedIntent, definition)) Fail("generated correction intent differs from reviewed intent");
  const record = ReadJson(recordPath, "correction output record");
  ExactKeys(record, ["schema_version", "kind", "version", "platform", "target", "native", "recipe", "artifact", "qualification"], "correction output record");
  if (!isDeepStrictEqual(record, CorrectionRecord(definition))) Fail("correction output record differs from reviewed intent");
  ValidateQualificationLogs(definition, redPath, greenPath);
  return { definition, tag: `cli-v${definition.version}`, compiler: definition.native.compiler_commit,
    artifact: definition.artifact.name, record: definition.record.name, root };
}
