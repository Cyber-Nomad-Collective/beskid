#!/usr/bin/env node
// Match beskid_tools/corelib_fingerprint.rs and its build.rs embed selection.
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, lstatSync } from 'node:fs';
import { join, relative } from 'node:path';

const [mode, source, installed] = process.argv.slice(2);
const skipped = new Set(['.git', 'Project.lock', 'obj', '.beskid', 'target', '.venv-ci', '.nox']);
const marker = '.beskid-bundle.sha256';

function filesUnder(root, current = root) {
  const files = [];
  for (const name of readdirSync(current)) {
    if (skipped.has(name) || name === marker) continue;
    const path = join(current, name);
    const stat = lstatSync(path);
    if (stat.isSymbolicLink()) throw new Error(`Corelib bundle contains a symlink: ${path}`);
    if (stat.isDirectory()) files.push(...filesUnder(root, path));
    else if (stat.isFile()) files.push(relative(root, path));
    else throw new Error(`Corelib bundle contains a non-file: ${path}`);
  }
  return files;
}

function embeddedFiles(root) {
  const files = [];
  for (const name of readdirSync(root)) {
    const path = join(root, name);
    if (lstatSync(path).isFile() && (name.endsWith('.bws') || ['LICENSE', 'NOTICE', 'LICENSING.md'].includes(name))) {
      files.push(name);
    }
  }
  for (const dir of ['packages', 'beskid_corelib']) files.push(...filesUnder(join(root, dir)).map(path => join(dir, path)));
  return files;
}

function sorted(files) {
  // Rust sorts Vec<PathBuf> by OsStr components. A directory component named
  // `Emitter` precedes sibling file `Emitter.bd`, even though '.' sorts before
  // '/' when comparing the complete slash-separated strings bytewise.
  return files.sort((left, right) => {
    const leftParts = left.split('/');
    const rightParts = right.split('/');
    for (let index = 0; index < Math.min(leftParts.length, rightParts.length); index++) {
      const order = Buffer.compare(Buffer.from(leftParts[index]), Buffer.from(rightParts[index]));
      if (order !== 0) return order;
    }
    return leftParts.length - rightParts.length;
  });
}

function fingerprint(root, files) {
  const hash = createHash('sha256');
  for (const file of sorted(files)) {
    const name = Buffer.from(file);
    const length = Buffer.alloc(8);
    length.writeBigUInt64LE(BigInt(name.length));
    hash.update(length);
    hash.update(name);
    hash.update(readFileSync(join(root, file)));
  }
  return hash.digest('hex');
}

try {
  if (mode === '--fingerprint' && source && !installed) {
    process.stdout.write(`${fingerprint(source, filesUnder(source))}\n`);
  } else if (mode === '--verify' && source && installed) {
    const expectedFiles = sorted(embeddedFiles(source));
    const installedFiles = sorted(filesUnder(installed));
    if (expectedFiles.length === 0 || expectedFiles.join('\0') !== installedFiles.join('\0')) {
      throw new Error('materialized Corelib file inventory differs from pinned embedded source');
    }
    for (const file of expectedFiles) {
      if (!readFileSync(join(source, file)).equals(readFileSync(join(installed, file)))) {
        throw new Error(`materialized Corelib file differs from pinned source: ${file}`);
      }
    }
    const actual = fingerprint(installed, installedFiles);
    const recorded = readFileSync(join(installed, marker), 'utf8').trim();
    if (actual !== recorded) throw new Error('materialized Corelib bundle fingerprint mismatch');
    process.stdout.write(`verified pinned Corelib bundle ${actual}\n`);
  } else {
    throw new Error('usage: verify-release-corelib-bundle.mjs --verify <source> <installed>');
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
