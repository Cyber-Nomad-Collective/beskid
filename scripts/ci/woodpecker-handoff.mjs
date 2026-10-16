#!/usr/bin/env node
// Validate one role-separated build handoff, the flat directory that woodpecker-upload-handoff.sh
// uploads to `/incoming/<pipeline>-<source>/<role>` of its role inbox. A repackage that supersedes the
// current packaging of the same build uploads to `/incoming/<pipeline>-<source>@<packaged_by>/<role>`
// instead, so no handoff is ever overwritten in place.
//
// Usage:
//   woodpecker-handoff.mjs marker <UPLOAD_COMPLETE>
//   woodpecker-handoff.mjs validate <dir> <role> <source> <compiler> <version> <pipeline>
//   woodpecker-handoff.mjs resolve <markers-dir> <role> <source> <compiler> <pipeline> [<entry>...]
//
// `marker` prints the identity of one completion marker as JSON. `validate` checks the complete
// handoff against the expected identity: real files only, safe names, the completion marker, and every
// payload file against UPLOAD_SHA256SUMS. It prints the identity plus the digest of UPLOAD_SHA256SUMS.
// Each platform is built by its own pipeline, so the pipeline number is per role. `resolve` selects
// the current handoff of one build among its inbox entries (ResolveBuildHandoffs).
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

// A superseding repackage names the packaging it replaces: its pipeline (the build pipeline when the
// build packaged itself) and that packaging's root commit.
const SUPERSEDE_FIELDS = {
  supersedes: value => /^[1-9][0-9]*$/.test(value),
  supersedes_commit: value => /^[0-9a-f]{40}$/.test(value),
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
    if (!match || !(match[1] in FIELDS || match[1] in REPACKAGE_FIELDS || match[1] in SUPERSEDE_FIELDS) || fields[match[1]] !== undefined) Fail(`invalid ${MARKER}`);
    fields[match[1]] = match[2];
  }
  for (const [key, valid] of Object.entries(FIELDS)) if (fields[key] === undefined || !valid(fields[key])) Fail(`invalid ${MARKER}`);
  const repackaged = Object.keys(REPACKAGE_FIELDS).filter(key => fields[key] !== undefined);
  if (repackaged.length !== 0 && repackaged.length !== Object.keys(REPACKAGE_FIELDS).length) Fail(`invalid ${MARKER}: incomplete repackaging identity`);
  for (const key of repackaged) if (!REPACKAGE_FIELDS[key](fields[key])) Fail(`invalid ${MARKER}`);
  if (repackaged.length && fields.packaged_by === fields.pipeline) Fail(`invalid ${MARKER}: a repackaging pipeline cannot be the build pipeline`);
  const superseding = Object.keys(SUPERSEDE_FIELDS).filter(key => fields[key] !== undefined);
  if (superseding.length !== 0 && superseding.length !== Object.keys(SUPERSEDE_FIELDS).length) Fail(`invalid ${MARKER}: incomplete superseded packaging`);
  for (const key of superseding) if (!SUPERSEDE_FIELDS[key](fields[key])) Fail(`invalid ${MARKER}`);
  if (superseding.length) {
    if (!repackaged.length) Fail(`invalid ${MARKER}: only a repackaged handoff can supersede a packaging`);
    const [build, previous, current] = [fields.pipeline, fields.supersedes, fields.packaged_by].map(Number);
    if (previous < build || previous >= current) Fail(`invalid ${MARKER}: the superseded packaging must be the build or an earlier repackaging`);
  }
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
  const superseded = fields.supersedes === undefined ? {} : { supersedes: Number(fields.supersedes) };
  return { ...fields, pipeline: Number(fields.pipeline), ...packaged, ...superseded, upload_sha256sums_sha256: Digest(join(dir, SUMS)) };
}

// The packaging that produced a handoff's installers: the repackaging pipeline and root commit, or
// the build pipeline and source when the build packaged itself.
export function HandoffPackaging(fields) {
  return fields.packaged_by === undefined
    ? { pipeline: Number(fields.pipeline), commit: fields.source }
    : { pipeline: Number(fields.packaged_by), commit: fields.packaged_by_commit };
}

// Select the current handoff of build <pipeline>-<source> among inbox entry names. `markers` maps an
// entry name to its UPLOAD_COMPLETE path, or to null when the upload is unfinished; unfinished entries
// are skipped. The base entry `<pipeline>-<source>` is the first packaging. Every superseding entry
// `<pipeline>-<source>@<M>` must be packaged by M and supersede exactly the packaging current before
// it, so the complete handoffs of one build form one chain ordered by packaging pipeline; anything
// else (a superseding entry without a predecessor, two packagings superseding the same one, a
// packaging named twice) is ambiguous and fails closed. Returns the newest packaging of the chain.
export function ResolveBuildHandoffs(markers, expected) {
  const { role, source, compiler, pipeline } = expected;
  const label = `${role} handoff from pipeline ${pipeline}`;
  const pattern = new RegExp(`^${pipeline}-${source}(?:@([1-9][0-9]*))?$`);
  const complete = [], incomplete = [];
  for (const [entry, path] of Object.entries(markers)) {
    const match = pattern.exec(entry);
    if (!match) Fail(`${label}: ${entry} is not an entry of build ${pipeline}-${source}`);
    if (path === null) { incomplete.push(entry); continue; }
    let fields;
    try { fields = ReadUploadComplete(path); } catch (error) { Fail(`${label} has an invalid completion marker in ${entry}: ${error.message}`); }
    for (const [key, value] of Object.entries({ role, source, compiler, pipeline })) {
      if (fields[key] !== value) Fail(`${label} is not a build of source ${source}: ${entry} UPLOAD_COMPLETE ${key} is ${fields[key]}, expected ${value}`);
    }
    const superseding = match[1];
    if (superseding === undefined && fields.supersedes !== undefined) Fail(`${label}: the base entry ${entry} cannot supersede a packaging`);
    if (superseding !== undefined && (fields.packaged_by !== superseding || fields.supersedes === undefined)) {
      Fail(`${label}: ${entry} must be packaged by pipeline ${superseding} and name the packaging it supersedes`);
    }
    complete.push({ entry, fields, packaging: HandoffPackaging(fields) });
  }
  if (complete.length === 0) return { selected: null, superseded: [], incomplete: incomplete.sort() };
  complete.sort((a, b) => a.packaging.pipeline - b.packaging.pipeline);
  const [base, ...rest] = complete;
  if (base.fields.supersedes !== undefined) Fail(`${label}: ${base.entry} supersedes packaging ${base.fields.supersedes}, which has no complete handoff`);
  let current = base;
  const superseded = [];
  for (const next of rest) {
    if (next.packaging.pipeline === current.packaging.pipeline) Fail(`${label}: packaging pipeline ${next.packaging.pipeline} is named by both ${current.entry} and ${next.entry}`);
    if (Number(next.fields.supersedes) !== current.packaging.pipeline || next.fields.supersedes_commit !== current.packaging.commit) {
      Fail(`${label}: ${next.entry} supersedes packaging ${next.fields.supersedes} (${next.fields.supersedes_commit}), but the current packaging is ${current.packaging.pipeline} (${current.packaging.commit}) in ${current.entry}`);
    }
    superseded.push({ entry: current.entry, ...current.packaging });
    current = next;
  }
  return { selected: { entry: current.entry, fields: current.fields, packaging: current.packaging }, superseded, incomplete: incomplete.sort() };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const [command, ...args] = process.argv.slice(2);
    let result;
    if (command === "marker" && args.length === 1) {
      result = ReadUploadComplete(args[0]);
    } else if (command === "resolve" && args.length >= 5) {
      const [dir, role, source, compiler, pipeline, ...entries] = args;
      const markers = Object.fromEntries(entries.map(entry => {
        if (!/^[A-Za-z0-9][A-Za-z0-9@._-]*$/.test(entry)) Fail(`unsafe handoff entry name: ${entry}`);
        const path = join(dir, entry);
        let present = false;
        try { present = lstatSync(path).isFile(); } catch { present = false; }
        return [entry, present ? path : null];
      }));
      result = ResolveBuildHandoffs(markers, { role, source, compiler, pipeline });
    } else if (command === "validate" && args.length === 6) {
      const [dir, role, source, compiler, version, pipeline] = args;
      result = ValidateHandoff(dir, { role, source, compiler, version, pipeline });
    } else {
      process.stderr.write("usage: woodpecker-handoff.mjs marker <UPLOAD_COMPLETE> | validate <dir> <role> <source> <compiler> <version> <pipeline> | resolve <markers-dir> <role> <source> <compiler> <pipeline> [<entry>...]\n");
      process.exit(2);
    }
    process.stdout.write(`${JSON.stringify(result)}\n`);
  } catch (error) {
    process.stderr.write(`woodpecker handoff: ${error.message}\n`);
    process.exit(1);
  }
}
