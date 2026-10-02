#!/usr/bin/env node
// Obtain the immutable, checksummed full Linux bundle for the protected PCKG job.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, lstatSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { AssertCleanDistrib } from './package-source-authority.mjs';
import { parseExactReleaseVersion } from './release-version.mjs';

const scripts = dirname(fileURLToPath(import.meta.url));
const root = resolve(scripts, '../..');
const distrib = join(root, 'beskid_distrib');
function Run(command, args, cwd = root) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8' });
  if (result.error || result.status !== 0) throw new Error(`${command} failed: ${result.error?.message || result.stderr || result.stdout}`);
  return result.stdout;
}

let stage;
try {
  if (process.argv.length !== 4) throw new Error('usage: prepare-pckg-toolchain.mjs <stable-version> <new-prefix>');
  const version = parseExactReleaseVersion(process.argv[2], { stableOnly: true });
  const destination = resolve(process.argv[3]);
  const pinnedDistrib = Run('git', ['rev-parse', 'HEAD:beskid_distrib']).trim();
  if (Run('git', ['rev-parse', 'HEAD'], distrib).trim() !== pinnedDistrib) throw new Error('distribution checkout does not match source gitlink');
  AssertCleanDistrib(distrib);
  if (existsSync(destination)) throw new Error('toolchain prefix already exists');
  try { lstatSync(destination); throw new Error('toolchain prefix already exists'); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }

  const target = 'x86_64-unknown-linux-gnu';
  const asset = `beskid-${version}-${target}.tar.gz`;
  const repository = 'Cyber-Nomad-Collective/beskid_compiler';
  const expected_digest = Run('gh', ['api', `repos/${repository}/releases/tags/v${version}`,
    '--jq', `.assets[] | select(.name == "${asset}") | .digest`]).trim();
  if (!/^sha256:[0-9a-f]{64}$/.test(expected_digest)) throw new Error('immutable bundle must have exactly one SHA-256 release digest');
  stage = mkdtempSync(join(dirname(destination), '.pckg-toolchain-'));
  Run('gh', ['release', 'download', `v${version}`, '--repo', repository, '--pattern', asset, '--dir', stage]);
  const archive = join(stage, asset);
  const stat = lstatSync(archive);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('downloaded bundle is not a regular archive');
  const actual = `sha256:${createHash('sha256').update(readFileSync(archive)).digest('hex')}`;
  if (actual !== expected_digest) throw new Error('immutable bundle SHA-256 digest mismatch');
  Run('bash', [join(distrib, 'scripts/extract-release-bundle.sh'), archive, version, target, destination]);
  process.stdout.write(`${destination}\n`);
} catch (error) {
  console.error(`PCKG toolchain preparation: ${error.message}`);
  process.exitCode = 1;
} finally {
  if (stage) rmSync(stage, { recursive: true, force: true });
}
