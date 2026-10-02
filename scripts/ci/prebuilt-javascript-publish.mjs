#!/usr/bin/env node
// Prepare checksum-bound npm tarballs without credentials, then publish only
// those prebuilt bytes from a protected Woodpecker step.
import {
  chmodSync,
  copyFileSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const REGISTRY = 'https://npm.pkg.github.com';
const MAX_ARTIFACT = 128 * 1024 * 1024;
const LOCAL_SPEC = /^(?:file|link|workspace):/;
const STABLE_VERSION = /^(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)$/;
const SHA = /^[0-9a-f]{40}$/;
const LANES = {
  shared: {
    task: 'shared-packages-publish',
    submodule: 'beskid_web_common',
    packages: [
      ['packages/trudoc', '@cyber-nomad-collective/trudoc', '0.2.7'],
      ['packages/beskid-ui', '@cyber-nomad-collective/beskid-ui', '0.2.8'],
      ['packages/beskid-ui-react', '@cyber-nomad-collective/beskid-ui-react', '0.2.9'],
      ['packages/beskid-auth-client', '@beskid/auth-client', '0.2.9'],
      ['packages/beskid-server-observability', '@cyber-nomad-collective/beskid-server-observability', '0.2.0'],
    ],
  },
  treesitter: {
    task: 'treesitter-publish',
    submodule: 'beskid_treesitter',
    packages: [['.', '@cyber-nomad-collective/beskid-tree-sitter', '0.1.3']],
  },
};

function Require(condition, message) {
  if (!condition) throw new Error(message);
}

function RegularFile(path, message) {
  let stat;
  try {
    stat = lstatSync(path);
  } catch {
    throw new Error(message);
  }
  Require(stat.isFile() && !stat.isSymbolicLink(), message);
  return stat;
}

function OwnedDirectory(path, message) {
  let stat;
  try {
    stat = lstatSync(path);
  } catch {
    throw new Error(message);
  }
  Require(stat.isDirectory() && !stat.isSymbolicLink(), message);
}

function ReadJson(path) {
  const stat = RegularFile(path, `expected regular JSON file: ${path}`);
  Require(stat.size <= 4 * 1024 * 1024, `JSON file exceeds size bound: ${path}`);
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    throw new Error(`invalid JSON file: ${path}`);
  }
}

function Git(root, ...args) {
  const result = spawnSync('git', ['-C', root, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  Require(result.status === 0, 'source identity could not be verified');
  return result.stdout.trim();
}

function VerifyContext(lane, context = process.env) {
  const definition = LANES[lane];
  Require(definition, 'lane must be shared or treesitter');
  const head = Git(ROOT, 'rev-parse', 'HEAD');
  Require(
    context.CI_PIPELINE_EVENT === 'manual' &&
      context.CI_COMMIT_BRANCH === 'main' &&
      context.CI_REPO === 'Cyber-Nomad-Collective/beskid' &&
      context.BESKID_TASK === definition.task &&
      SHA.test(context.CI_COMMIT_SHA ?? '') &&
      context.CI_COMMIT_SHA === head,
    `publication requires the trusted Woodpecker ${definition.task} task on the checked-out root source`,
  );
  return head;
}

function VerifySource(definition, rootCommit) {
  const subroot = join(ROOT, definition.submodule);
  OwnedDirectory(subroot, `initialized ${definition.submodule} submodule is required`);
  const submoduleCommit = Git(subroot, 'rev-parse', 'HEAD');
  Require(SHA.test(submoduleCommit), 'invalid submodule source commit');
  const tree = Git(ROOT, 'ls-tree', rootCommit, '--', definition.submodule);
  Require(
    tree === `160000 commit ${submoduleCommit}\t${definition.submodule}`,
    `checked-out ${definition.submodule} does not match the root gitlink`,
  );
  Require(
    Git(subroot, 'status', '--porcelain', '--untracked-files=all') === '',
    `${definition.submodule} source must be clean before packaging`,
  );
  return submoduleCommit;
}

function RejectPreparationCredentials(context = process.env) {
  for (const name of ['NODE_AUTH_TOKEN', 'NPM_TOKEN', 'GITHUB_TOKEN', 'GH_TOKEN']) {
    Require(!(context[name] ?? '').trim(), 'preparation must not receive publisher credentials');
  }
}

function ValidateManifest(manifest, expectedName, expectedVersion) {
  Require(manifest && typeof manifest === 'object' && !Array.isArray(manifest), 'package manifest must be an object');
  Require(manifest.name === expectedName, `package identity mismatch: expected ${expectedName}`);
  Require(STABLE_VERSION.test(manifest.version ?? ''), `package version must be stable: ${expectedName}`);
  Require(manifest.version === expectedVersion, `package version mismatch: expected ${expectedName}@${expectedVersion}`);
  Require(manifest.private !== true, `publishable package is private: ${expectedName}`);
  Require(
    manifest.publishConfig?.registry === REGISTRY && manifest.publishConfig?.access === 'public',
    `unapproved publish configuration: ${expectedName}`,
  );
}

function RewriteLocalDependencies(manifest, versions) {
  for (const section of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']) {
    const dependencies = manifest[section];
    if (dependencies === undefined) continue;
    Require(dependencies && typeof dependencies === 'object' && !Array.isArray(dependencies), `invalid ${section}`);
    for (const [name, spec] of Object.entries(dependencies)) {
      if (typeof spec !== 'string' || !LOCAL_SPEC.test(spec)) continue;
      Require(versions.has(name), `unresolved local dependency: ${name}`);
      dependencies[name] = versions.get(name);
    }
  }
}

function CopyPackageTree(source, destination) {
  OwnedDirectory(source, `package source must be a real directory: ${source}`);
  mkdirSync(destination, { mode: 0o700 });
  for (const entry of readdirSync(source)) {
    if (['.git', '.github', 'node_modules', '.pnpm'].includes(entry)) continue;
    const from = join(source, entry);
    const to = join(destination, entry);
    const stat = lstatSync(from);
    Require(!stat.isSymbolicLink(), `symlink in package source: ${entry}`);
    if (stat.isDirectory()) CopyPackageTree(from, to);
    else if (stat.isFile()) copyFileSync(from, to);
    else throw new Error(`special file in package source: ${entry}`);
  }
}

function ArtifactName(name, version) {
  return `${name.replace(/^@/, '').replace('/', '-')}-${version}.tgz`;
}

function Digest(path) {
  const stat = RegularFile(path, `expected regular artifact: ${path}`);
  Require(stat.size > 0 && stat.size <= MAX_ARTIFACT, `artifact size is invalid: ${path}`);
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function NpmPack(stage, artifacts, expectedFile) {
  const result = spawnSync('npm', ['pack', stage, '--ignore-scripts', '--json', '--pack-destination', artifacts], {
    cwd: ROOT,
    env: { ...process.env },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  Require(result.status === 0, 'npm pack failed');
  let output;
  try {
    output = JSON.parse(result.stdout);
  } catch {
    throw new Error('npm pack returned invalid metadata');
  }
  Require(Array.isArray(output) && output.length === 1 && output[0]?.filename === expectedFile, 'npm pack returned an unexpected artifact');
  return join(artifacts, expectedFile);
}

function WriteChecksums(snapshot, relativeFiles) {
  const lines = relativeFiles.map((name) => `${Digest(join(snapshot, name))}  ${name}`);
  writeFileSync(join(snapshot, 'SHA256SUMS'), `${lines.join('\n')}\n`, { mode: 0o444 });
}

function Prepare(lane, snapshot) {
  const definition = LANES[lane];
  const rootCommit = VerifyContext(lane);
  const submoduleCommit = VerifySource(definition, rootCommit);
  RejectPreparationCredentials();
  Require(!snapshot.startsWith(`${ROOT}${sep}`), 'durable snapshot must be outside the source checkout');
  try {
    mkdirSync(snapshot, { mode: 0o700, recursive: false });
  } catch {
    throw new Error('snapshot already exists or its parent is unavailable');
  }
  const artifacts = join(snapshot, 'artifacts');
  const staging = join(snapshot, 'staging');
  mkdirSync(artifacts, { mode: 0o700 });
  mkdirSync(staging, { mode: 0o700 });
  const versions = new Map(definition.packages.map(([, name, version]) => [name, version]));
  const packages = [];
  for (const [packagePath, expectedName, expectedVersion] of definition.packages) {
    const source = resolve(ROOT, definition.submodule, packagePath);
    const manifest = ReadJson(join(source, 'package.json'));
    ValidateManifest(manifest, expectedName, expectedVersion);
    const stage = join(staging, String(packages.length));
    CopyPackageTree(source, stage);
    const stagedManifest = ReadJson(join(stage, 'package.json'));
    RewriteLocalDependencies(stagedManifest, versions);
    writeFileSync(join(stage, 'package.json'), `${JSON.stringify(stagedManifest, null, 2)}\n`);
    const tarball = ArtifactName(expectedName, expectedVersion);
    const artifact = NpmPack(stage, artifacts, tarball);
    packages.push({
      name: expectedName,
      version: expectedVersion,
      source_path: `${definition.submodule}/${packagePath}`.replace('/.', ''),
      tarball,
      sha256: Digest(artifact),
    });
    chmodSync(artifact, 0o444);
  }
  rmSync(staging, { recursive: true });
  chmodSync(artifacts, 0o555);
  const receipt = {
    schema_version: 1,
    lane,
    registry: REGISTRY,
    source: {
      repository: 'Cyber-Nomad-Collective/beskid',
      root_commit: rootCommit,
      submodule_path: definition.submodule,
      submodule_commit: submoduleCommit,
    },
    packages,
  };
  const receiptPath = join(snapshot, 'package-receipt.json');
  writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, { mode: 0o444 });
  WriteChecksums(snapshot, ['package-receipt.json', ...packages.map(({ tarball }) => `artifacts/${tarball}`)]);
  return Verify(lane, snapshot);
}

function ParseChecksums(snapshot) {
  const path = join(snapshot, 'SHA256SUMS');
  RegularFile(path, 'SHA256SUMS must be a regular file');
  const checksums = new Map();
  for (const line of readFileSync(path, 'utf8').trimEnd().split('\n')) {
    const match = line.match(/^([0-9a-f]{64})  ([A-Za-z0-9@._/-]+)$/);
    Require(match, 'invalid checksum record');
    Require(!checksums.has(match[2]), 'duplicate checksum record');
    Require(!match[2].startsWith('/') && !match[2].split('/').includes('..'), 'unsafe checksum path');
    checksums.set(match[2], match[1]);
  }
  return checksums;
}

function VerifySnapshotInventory(snapshot) {
  const required = new Set(['artifacts', 'package-receipt.json', 'SHA256SUMS']);
  const allowed = new Set([...required, 'publish-results.json']);
  const actual = readdirSync(snapshot);
  Require(actual.every((name) => allowed.has(name)), 'snapshot contains an unexpected entry');
  Require(required.size === [...required].filter((name) => actual.includes(name)).length, 'snapshot inventory is incomplete');
  if (actual.includes('publish-results.json')) {
    RegularFile(join(snapshot, 'publish-results.json'), 'publish results must be a regular file');
  }
}

function Verify(lane, snapshot) {
  const definition = LANES[lane];
  const rootCommit = VerifyContext(lane);
  const submoduleCommit = VerifySource(definition, rootCommit);
  OwnedDirectory(snapshot, 'snapshot must be a real directory');
  OwnedDirectory(join(snapshot, 'artifacts'), 'artifact directory must be a real directory');
  VerifySnapshotInventory(snapshot);
  const receipt = ReadJson(join(snapshot, 'package-receipt.json'));
  const checksums = ParseChecksums(snapshot);
  const expectedChecksumFiles = ['package-receipt.json', ...definition.packages.map(([, name, version]) => `artifacts/${ArtifactName(name, version)}`)];
  Require(
    checksums.size === expectedChecksumFiles.length && expectedChecksumFiles.every((name) => checksums.has(name)),
    'checksum inventory does not match the fixed package set',
  );
  for (const [name, expected] of checksums) {
    Require(Digest(join(snapshot, name)) === expected, `checksum mismatch: ${name}`);
  }
  Require(
    receipt.schema_version === 1 && receipt.lane === lane && receipt.registry === REGISTRY,
    'package receipt identity mismatch',
  );
  Require(
    receipt.source?.repository === 'Cyber-Nomad-Collective/beskid' &&
      receipt.source?.root_commit === rootCommit &&
      receipt.source?.submodule_path === definition.submodule &&
      receipt.source?.submodule_commit === submoduleCommit,
    'package receipt source mismatch',
  );
  Require(Array.isArray(receipt.packages) && receipt.packages.length === definition.packages.length, 'package receipt set mismatch');
  const expectedArtifacts = new Set();
  for (let index = 0; index < definition.packages.length; index += 1) {
    const [packagePath, name, version] = definition.packages[index];
    const item = receipt.packages[index];
    const tarball = ArtifactName(name, version);
    Require(
      item?.name === name && item.version === version && item.tarball === tarball &&
        item.source_path === `${definition.submodule}/${packagePath}`.replace('/.', '') &&
        item.sha256 === checksums.get(`artifacts/${tarball}`),
      `package receipt entry mismatch: ${name}`,
    );
    const artifactPath = join(snapshot, 'artifacts', tarball);
    const stat = RegularFile(artifactPath, `prebuilt artifact is not a regular file: ${tarball}`);
    Require((stat.mode & 0o222) === 0, `prebuilt artifact is writable: ${tarball}`);
    expectedArtifacts.add(tarball);
  }
  const actualArtifacts = readdirSync(join(snapshot, 'artifacts'));
  Require(actualArtifacts.length === expectedArtifacts.size && actualArtifacts.every((name) => expectedArtifacts.has(name)), 'artifact directory contains an unexpected file');
  return receipt;
}

function NpmEnvironment(token) {
  const env = {
    PATH: process.env.PATH ?? '',
    HOME: process.env.HOME ?? '',
    NODE_AUTH_TOKEN: token,
    CI: 'true',
    NPM_CONFIG_AUDIT: 'false',
    NPM_CONFIG_FUND: 'false',
    NPM_CONFIG_UPDATE_NOTIFIER: 'false',
    NPM_CONFIG_LOGLEVEL: 'error',
  };
  for (const name of ['SYSTEMROOT', 'TMPDIR', 'SSL_CERT_FILE', 'HTTPS_PROXY', 'HTTP_PROXY', 'NO_PROXY']) {
    if (process.env[name]) env[name] = process.env[name];
  }
  // Offline fixtures use these controls; production environments do not set them.
  for (const [name, value] of Object.entries(process.env)) {
    if (name.startsWith('FAKE_NPM_')) env[name] = value;
  }
  return env;
}

function RunNpm(args, cwd, env) {
  return spawnSync('npm', args, {
    cwd,
    env,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function RegistryVersion(name, version, cwd, env) {
  const result = RunNpm(['view', `${name}@${version}`, 'version', `--registry=${REGISTRY}`, '--json'], cwd, env);
  if (result.status === 0) {
    let found;
    try {
      found = JSON.parse(result.stdout);
    } catch {
      throw new Error(`registry returned invalid metadata for ${name}@${version}`);
    }
    Require(found === version, `registry returned conflicting metadata for ${name}@${version}`);
    return true;
  }
  const errorCodes = new Set(result.stderr.match(/\bE[A-Z0-9]+\b/g) ?? []);
  if (errorCodes.size === 1 && errorCodes.has('E404')) return false;
  throw new Error(`registry read failed for ${name}@${version}`);
}

function WriteResults(path, results) {
  const temporary = `${path}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(results, null, 2)}\n`, { mode: 0o600 });
  renameSync(temporary, path);
}

function Publish(lane, snapshot) {
  const definition = LANES[lane];
  const receipt = Verify(lane, snapshot);
  const token = process.env.NODE_AUTH_TOKEN?.trim() ?? '';
  Require(token, 'NODE_AUTH_TOKEN is missing');
  const npmrc = join(ROOT, definition.submodule, '.npmrc');
  RegularFile(npmrc, 'trusted npm authentication configuration is missing');
  Require(
    readFileSync(npmrc, 'utf8').split(/\r?\n/).includes('//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}'),
    'trusted npm authentication configuration is missing',
  );
  const resultsPath = join(snapshot, 'publish-results.json');
  Require(!readdirSync(snapshot).includes('publish-results.json'), 'publish results already exist; use a new pipeline snapshot');
  const cwd = join(ROOT, definition.submodule);
  const env = NpmEnvironment(token);
  const results = [];
  for (const item of receipt.packages) {
    try {
      Require(!RegistryVersion(item.name, item.version, cwd, env), `${item.name}@${item.version} already exists`);
    } catch (error) {
      results.push({ name: item.name, version: item.version, sha256: item.sha256, status: 'failed' });
      WriteResults(resultsPath, results);
      throw error;
    }
  }
  for (const item of receipt.packages) {
    const record = { name: item.name, version: item.version, sha256: item.sha256, status: 'failed' };
    try {
      Require(!RegistryVersion(item.name, item.version, cwd, env), `${item.name}@${item.version} already exists`);
      const artifact = join(snapshot, 'artifacts', item.tarball);
      Require(Digest(artifact) === item.sha256, `checksum mismatch before publish: ${item.tarball}`);
      const result = RunNpm(
        ['publish', artifact, '--ignore-scripts', `--registry=${REGISTRY}`, '--access', 'public', '--provenance=false'],
        cwd,
        env,
      );
      Require(result.status === 0, `npm publish failed for ${item.name}@${item.version}`);
      Require(RegistryVersion(item.name, item.version, cwd, env), `published registry version is missing: ${item.name}@${item.version}`);
      record.status = 'published';
    } finally {
      results.push(record);
      WriteResults(resultsPath, results);
    }
  }
  return results;
}

function Main(argv) {
  const [command, lane, snapshotArgument] = argv.slice(2);
  Require(['prepare', 'verify', 'publish'].includes(command), 'usage: prebuilt-javascript-publish.mjs prepare|verify|publish shared|treesitter SNAPSHOT');
  Require(LANES[lane], 'lane must be shared or treesitter');
  Require(snapshotArgument, 'snapshot path is required');
  const snapshot = resolve(snapshotArgument);
  if (command === 'prepare') Prepare(lane, snapshot);
  else if (command === 'verify') Verify(lane, snapshot);
  else Publish(lane, snapshot);
}

try {
  Main(process.argv);
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : 'JavaScript publisher failed'}\n`);
  process.exitCode = 1;
}
