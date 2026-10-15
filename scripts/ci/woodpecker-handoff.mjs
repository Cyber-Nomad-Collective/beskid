#!/usr/bin/env node
// Validate one role-separated build handoff, the flat directory that woodpecker-upload-handoff.sh
// uploads to `/incoming/<pipeline>-<source>/<role>` of its role inbox.
//
// Usage:
//   woodpecker-handoff.mjs marker <UPLOAD_COMPLETE>
//   woodpecker-handoff.mjs validate <dir> <role> <source> <compiler> <version> <pipeline>
//
// `marker` prints the identity of one completion marker as JSON. `validate` checks the complete
// handoff against the expected identity: real files only, safe names, the completion marker, and every
// payload file against UPLOAD_SHA256SUMS. It prints the identity plus the digest of UPLOAD_SHA256SUMS.
// Each platform is built by its own pipeline, so the pipeline number is per role.
import { createHash } from "node:crypto";
import { lstatSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

export const ROLES = ["linux", "macos", "windows"];
const MARKER = "UPLOAD_COMPLETE";
const SUMS = "UPLOAD_SHA256SUMS";
const NAME = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const FIELDS = {
  role: value => ROLES.includes(value),
  source: value => /^[0-9a-f]{40}$/.test(value),
  compiler: value => /^[0-9a-f]{40}$/.test(value),
  version: value => /^[0-9]+\.[0-9]+\.[0-9]+$/.test(value),
  pipeline: value => /^[1-9][0-9]*$/.test(value),
};
// A repackaged handoff (woodpecker-repackage-platform.sh) keeps the build's identity above, `pipeline`
// being the build pipeline, and names the pipeline and root commit that packaged its installers.
const REPACKAGE_FIELDS = {
  packaged_by: value => /^[1-9][0-9]*$/.test(value),
  packaged_by_commit: value => /^[0-9a-f]{40}$/.test(value),
};

function Fail(message) {
  throw new Error(message);
}
function Stat(path) {
  try { return lstatSync(path); } catch { return Fail(`missing handoff file: ${path}`); }
}
function Digest(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

// The identity fields of one completion marker: exactly the five the uploader writes, plus both
// repackaging fields or neither.
export function ReadUploadComplete(path) {
  const item = Stat(path);
  if (item.isSymbolicLink() || !item.isFile()) Fail(`${MARKER} is not a regular file`);
  const fields = {};
  for (const line of readFileSync(path, "utf8").trimEnd().split("\n")) {
    const match = /^([a-z_]+)=(.*)$/.exec(line);
    if (!match || !(match[1] in FIELDS || match[1] in REPACKAGE_FIELDS) || fields[match[1]] !== undefined) Fail(`invalid ${MARKER}`);
    fields[match[1]] = match[2];
  }
  for (const [key, valid] of Object.entries(FIELDS)) if (fields[key] === undefined || !valid(fields[key])) Fail(`invalid ${MARKER}`);
  const repackaged = Object.keys(REPACKAGE_FIELDS).filter(key => fields[key] !== undefined);
  if (repackaged.length !== 0 && repackaged.length !== Object.keys(REPACKAGE_FIELDS).length) Fail(`invalid ${MARKER}: incomplete repackaging identity`);
  for (const key of repackaged) if (!REPACKAGE_FIELDS[key](fields[key])) Fail(`invalid ${MARKER}`);
  if (repackaged.length && fields.packaged_by === fields.pipeline) Fail(`invalid ${MARKER}: a repackaging pipeline cannot be the build pipeline`);
  return fields;
}

export function ValidateHandoff(dir, expected) {
  const root = Stat(dir);
  if (root.isSymbolicLink() || !root.isDirectory()) Fail("handoff role is not a real directory");
  const names = readdirSync(dir);
  for (const name of names) {
    if (!NAME.test(name)) Fail(`unsafe handoff name: ${name}`);
    const item = Stat(join(dir, name));
    if (item.isSymbolicLink() || !item.isFile()) Fail(`handoff entry is not a regular file: ${name}`);
  }
  if (!names.includes(MARKER) || !names.includes(SUMS)) Fail("handoff is incomplete");
  const fields = ReadUploadComplete(join(dir, MARKER));
  for (const key of Object.keys(FIELDS)) {
    if (fields[key] !== expected[key]) Fail(`${MARKER} identity mismatch: ${key} is ${fields[key]}, expected ${expected[key]}`);
  }
  const payload = names.filter(name => !name.startsWith("UPLOAD_")).sort();
  const sums = new Map();
  for (const line of readFileSync(join(dir, SUMS), "utf8").split(/\r?\n/)) {
    if (!line) continue;
    const match = /^([0-9a-fA-F]{64}) [ *]([^/\\]+)$/.exec(line);
    if (!match || sums.has(match[2])) Fail("malformed or repeated handoff checksum");
    sums.set(match[2], match[1].toLowerCase());
  }
  if (payload.length !== sums.size || payload.some(name => !sums.has(name))) Fail("handoff checksum inventory mismatch");
  for (const name of payload) if (Digest(join(dir, name)) !== sums.get(name)) Fail(`handoff checksum mismatch: ${name}`);
  const packaged = fields.packaged_by === undefined ? {} : { packaged_by: Number(fields.packaged_by) };
  return { ...fields, pipeline: Number(fields.pipeline), ...packaged, upload_sha256sums_sha256: Digest(join(dir, SUMS)) };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const [command, ...args] = process.argv.slice(2);
    let result;
    if (command === "marker" && args.length === 1) {
      result = ReadUploadComplete(args[0]);
    } else if (command === "validate" && args.length === 6) {
      const [dir, role, source, compiler, version, pipeline] = args;
      result = ValidateHandoff(dir, { role, source, compiler, version, pipeline });
    } else {
      process.stderr.write("usage: woodpecker-handoff.mjs marker <UPLOAD_COMPLETE> | validate <dir> <role> <source> <compiler> <version> <pipeline>\n");
      process.exit(2);
    }
    process.stdout.write(`${JSON.stringify(result)}\n`);
  } catch (error) {
    process.stderr.write(`woodpecker handoff: ${error.message}\n`);
    process.exit(1);
  }
}
