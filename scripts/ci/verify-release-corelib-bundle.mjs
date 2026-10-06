#!/usr/bin/env node
// Match compiler/crates/beskid_abi/src/corelib_bundle.rs: `fingerprint_corelib_bundle_dir` and the
// CoreLib.bws member inventory (`corelib_bundle_inventory`) that beskid_tools/build.rs embeds.
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, lstatSync } from 'node:fs';
import { join, relative } from 'node:path';

const [mode, source, installed] = process.argv.slice(2);
const skipped = new Set(['.git', 'Project.lock', 'obj', '.beskid', 'node_modules', 'target', '.venv-ci', '.nox']);
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

function isProjectDirectory(path) {
  return readdirSync(path).some(name => name.endsWith('.bproj') && lstatSync(join(path, name)).isFile());
}

// Strict reader for the `path` of every top-level `member` block (the Rust
// `parse_corelib_workspace_member_paths`). Anything outside the block/assignment
// subset fails closed.
function workspaceMemberPaths(source) {
  const tokens = [];
  for (let at = 0; at < source.length;) {
    const ch = source[at];
    if (/\s/.test(ch)) { at++; continue; }
    if (ch === '/' && source[at + 1] === '/') { while (at < source.length && source[at] !== '\n') at++; continue; }
    if ('{}=[],'.includes(ch)) { tokens.push({ kind: ch }); at++; continue; }
    if (ch === '"') {
      const end = source.indexOf('"', at + 1);
      const text = end < 0 ? null : source.slice(at + 1, end);
      if (text === null || /[\\\n]/.test(text)) throw new Error(`CoreLib.bws: unsupported string at ${at}`);
      tokens.push({ kind: 'text', text }); at = end + 1; continue;
    }
    const word = /^[A-Za-z0-9_][A-Za-z0-9_.-]*/.exec(source.slice(at));
    if (!word) throw new Error(`CoreLib.bws: unexpected character ${JSON.stringify(ch)} at ${at}`);
    tokens.push({ kind: 'word', text: word[0] }); at += word[0].length;
  }
  let at = 0;
  const next = () => tokens[at++];
  const expect = (kind, context) => {
    const token = next();
    if (token?.kind !== kind) throw new Error(`CoreLib.bws: expected ${kind} ${context}`);
  };
  const value = () => {
    const token = next();
    if (token?.kind === 'text') return token.text;
    if (token?.kind === 'word') return null;
    if (token?.kind !== '[') throw new Error('CoreLib.bws: expected a value');
    for (;;) {
      const item = next();
      if (item?.kind === ']') return null;
      if (item?.kind !== 'text' && item?.kind !== 'word') throw new Error('CoreLib.bws: unexpected list item');
      const separator = next();
      if (separator?.kind === ']') return null;
      if (separator?.kind !== ',') throw new Error('CoreLib.bws: expected , or ] in list');
    }
  };
  const body = block => {
    let path;
    for (;;) {
      const token = next();
      if (token?.kind === '}') return path;
      if (token?.kind !== 'word') throw new Error(`CoreLib.bws: unexpected token in ${block} block`);
      const following = tokens[at];
      if (following?.kind === '=') {
        at++;
        const assigned = value();
        if (token.text === 'path') {
          if (path !== undefined) throw new Error(`CoreLib.bws: ${block} block assigns path twice`);
          if (assigned === null) throw new Error(`CoreLib.bws: ${block} block path must be a string`);
          path = assigned;
        }
      } else if (following?.kind === 'text') {
        at++;
        expect('{', 'after nested block label');
        body(token.text);
      } else if (following?.kind === '{') {
        at++;
        body(token.text);
      } else {
        throw new Error(`CoreLib.bws: unexpected token after ${token.text}`);
      }
    }
  };
  const members = [];
  while (at < tokens.length) {
    const kind = next();
    if (kind.kind !== 'word') throw new Error('CoreLib.bws: expected a top-level block');
    let label;
    if (tokens[at]?.kind === 'text') label = next().text;
    expect('{', 'to open a top-level block');
    const path = body(kind.text);
    if (kind.text === 'member') {
      if (label === undefined) throw new Error('CoreLib.bws: member block needs a name');
      if (path === undefined) throw new Error(`CoreLib.bws: member ${label} has no path`);
      members.push(path);
    }
  }
  return members;
}

function memberFiles(root, current, files) {
  for (const name of readdirSync(current)) {
    if (skipped.has(name) || name === marker) continue;
    const path = join(current, name);
    const stat = lstatSync(path);
    if (stat.isSymbolicLink()) throw new Error(`Corelib workspace contains a symlink: ${path}`);
    if (stat.isDirectory()) {
      // A nested project ships only when it is itself a workspace member.
      if (!isProjectDirectory(path)) memberFiles(root, path, files);
    } else if (stat.isFile()) files.push(relative(root, path));
    else throw new Error(`Corelib workspace contains a non-file: ${path}`);
  }
}

function embeddedFiles(root) {
  const manifests = readdirSync(root).filter(name => name.endsWith('.bws') && lstatSync(join(root, name)).isFile());
  if (manifests.length !== 1) throw new Error(`Corelib workspace must hold exactly one .bws manifest: ${root}`);
  const files = [manifests[0]];
  for (const name of ['LICENSE', 'NOTICE', 'LICENSING.md']) {
    try {
      if (!lstatSync(join(root, name)).isFile()) throw new Error(`Corelib legal file is not a file: ${name}`);
      files.push(name);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  const seen = new Set();
  for (const member of workspaceMemberPaths(readFileSync(join(root, manifests[0]), 'utf8'))) {
    const parts = member.split('/');
    if (!member || member.includes('\\') || parts.some(part => !part || part === '.' || part === '..' || skipped.has(part))) {
      throw new Error(`CoreLib.bws member path must be relative below the workspace: ${member}`);
    }
    if (seen.has(member)) throw new Error(`CoreLib.bws lists member path twice: ${member}`);
    seen.add(member);
    const directory = join(root, member);
    if (!lstatSync(directory).isDirectory() || !isProjectDirectory(directory)) {
      throw new Error(`CoreLib.bws member is not a project directory: ${member}`);
    }
    memberFiles(root, directory, files);
  }
  return [...new Set(files)];
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
