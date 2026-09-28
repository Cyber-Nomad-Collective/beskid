#!/usr/bin/env node
// Validate a release owner's manual, artifact-bound exception to the Windows
// installer scenario-test gate. This is a decision record, not VM attestation.
import { createHash } from 'node:crypto';
import { lstatSync, readFileSync } from 'node:fs';

const args = process.argv.slice(2);
const inline = args[0] === '--json';
const [recordInput, sourceCommit, version, installerPath] = inline ? args.slice(1) : args;
function Fail(message) {
  throw new Error(`Windows installer owner waiver: ${message}`);
}

try {
  if (!recordInput || !sourceCommit || !version || !installerPath) Fail('missing validation input');
  if (inline && recordInput.length > 4096) Fail('inline record is too large');
  if (!inline) {
    const stat = lstatSync(recordInput);
    if (stat.isSymbolicLink() || !stat.isFile()) Fail('record must be a regular file, not a symlink');
  }
  const installerStat = lstatSync(installerPath);
  if (installerStat.isSymbolicLink() || !installerStat.isFile()) Fail('installer must be a regular file');

  const record = JSON.parse(inline ? recordInput : readFileSync(recordInput, 'utf8'));
  const keys = ['approved_utc', 'decision', 'installer_sha256', 'schema_version', 'scope', 'source_commit', 'version'];
  if (!record || Array.isArray(record) || typeof record !== 'object' ||
      JSON.stringify(Object.keys(record).sort()) !== JSON.stringify(keys)) Fail('unexpected record fields');
  if (record.schema_version !== 1 || record.decision !== 'release-owner-installer-test-waiver' ||
      record.scope !== 'windows-installer-scenario-tests-only') Fail('decision or scope mismatch');
  if (!/^[0-9a-f]{40}$/.test(sourceCommit) || record.source_commit !== sourceCommit ||
      record.version !== version) Fail('release identity mismatch');
  if (typeof record.approved_utc !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(record.approved_utc) ||
      Number.isNaN(Date.parse(record.approved_utc))) Fail('invalid approval timestamp');
  const digest = createHash('sha256').update(readFileSync(installerPath)).digest('hex');
  if (record.installer_sha256 !== digest) Fail('installer SHA-256 mismatch');
  process.stdout.write(`${JSON.stringify(record)}\n`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
