import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { chmodSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import test from 'node:test';

const REPO_ROOT = new URL('../../..', import.meta.url).pathname.replace(/\/$/, '');
const RUNNER_SOURCE = join(REPO_ROOT, 'scripts/ci/prebuilt-javascript-publish.mjs');
const REGISTRY = 'https://npm.pkg.github.com';
const SHARED = [
  ['packages/trudoc', '@cyber-nomad-collective/trudoc', '0.2.7', {}],
  ['packages/beskid-ui', '@cyber-nomad-collective/beskid-ui', '0.2.8', {
    '@cyber-nomad-collective/beskid-ui-react': 'file:../beskid-ui-react',
    '@cyber-nomad-collective/trudoc': 'file:../trudoc',
  }],
  ['packages/beskid-ui-react', '@cyber-nomad-collective/beskid-ui-react', '0.2.9', {}],
  ['packages/beskid-auth-client', '@beskid/auth-client', '0.2.9', {}],
  ['packages/beskid-server-observability', '@cyber-nomad-collective/beskid-server-observability', '0.2.0', {}],
];
const TREE = [['.', '@cyber-nomad-collective/beskid-tree-sitter', '0.1.3', {}]];

function Git(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function Manifest(name, version, dependencies = {}) {
  return {
    name,
    version,
    type: 'module',
    files: ['index.js', 'dist'],
    publishConfig: { registry: REGISTRY, access: 'public' },
    dependencies,
  };
}

function InitRepository(path) {
  Git(path, 'init', '-q');
  Git(path, 'config', 'user.email', 'fixture@example.invalid');
  Git(path, 'config', 'user.name', 'Fixture');
}

function WritePackages(root, lane, mutate) {
  const submodule = lane === 'shared' ? 'beskid_web_common' : 'beskid_treesitter';
  const packages = lane === 'shared' ? SHARED : TREE;
  const subroot = join(root, submodule);
  mkdirSync(subroot, { recursive: true });
  mkdirSync(join(root, '.fixture-store'), { recursive: true });
  InitRepository(subroot);
  writeFileSync(join(subroot, '.gitignore'), 'node_modules/\n');
  writeFileSync(join(subroot, '.npmrc'), '@cyber-nomad-collective:registry=https://npm.pkg.github.com\n@beskid:registry=https://npm.pkg.github.com\n//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}\n');
  for (const [relative, name, version, dependencies] of packages) {
    const directory = relative === '.' ? subroot : join(subroot, relative);
    mkdirSync(join(directory, 'dist'), { recursive: true });
    writeFileSync(join(directory, 'package.json'), JSON.stringify(Manifest(name, version, dependencies), null, 2) + '\n');
    writeFileSync(join(directory, 'index.js'), `export const packageName = ${JSON.stringify(name)};\n`);
    writeFileSync(join(directory, 'dist', 'built.js'), 'export const built = true;\n');
    mkdirSync(join(directory, 'node_modules'));
    symlinkSync(join(root, '.fixture-store'), join(directory, 'node_modules', 'fixture-dependency'));
  }
  mutate?.({ root, subroot, packages });
  Git(subroot, 'add', '-A');
  Git(subroot, 'commit', '-qm', 'fixture packages');
  return submodule;
}

function WriteNonSelectedSubmodule(root, lane) {
  const submodule = lane === 'shared' ? 'beskid_treesitter' : 'beskid_web_common';
  const subroot = join(root, submodule);
  mkdirSync(subroot, { recursive: true });
  InitRepository(subroot);
  writeFileSync(join(subroot, '.gitignore'), 'dist/\nnode_modules/\n');
  writeFileSync(join(subroot, 'README.md'), 'clean non-selected fixture submodule\n');
  Git(subroot, 'add', '-A');
  Git(subroot, 'commit', '-qm', 'fixture non-selected submodule');
  return submodule;
}

function WriteFakeNpm(bin) {
  mkdirSync(bin, { recursive: true });
  writeFileSync(join(bin, 'npm'), `#!/usr/bin/env node
const { appendFileSync, readFileSync, writeFileSync } = require('node:fs');
const { basename, join } = require('node:path');
const args = process.argv.slice(2);
const log = process.env.FAKE_NPM_LOG;
appendFileSync(log, JSON.stringify({ args, cwd: process.cwd(), credential: Boolean(process.env.NODE_AUTH_TOKEN) }) + '\\n');
const statePath = process.env.FAKE_NPM_STATE;
const state = JSON.parse(readFileSync(statePath, 'utf8'));
const save = () => writeFileSync(statePath, JSON.stringify(state));
if (args[0] === 'pack') {
  if (process.env.FAKE_NPM_PACK_FAIL === '1') process.exit(51);
  const source = args[1];
  const manifest = JSON.parse(readFileSync(join(source, 'package.json'), 'utf8'));
  if (!readFileSync(join(source, 'dist', 'built.js'), 'utf8').includes('built = true')) process.exit(56);
  appendFileSync(process.env.FAKE_NPM_MANIFEST_LOG, JSON.stringify(manifest) + '\\n');
  const filename = manifest.name.replace(/^@/, '').replace('/', '-') + '-' + manifest.version + '.tgz';
  const destination = args[args.indexOf('--pack-destination') + 1];
  writeFileSync(join(destination, filename), manifest.name + '@' + manifest.version + '\\n' + JSON.stringify(manifest.dependencies || {}));
  process.stdout.write(JSON.stringify([{ filename }]));
  process.exit(0);
}
if (args[0] === 'view') {
  if (process.env.FAKE_NPM_MIXED_ERROR === '1') { process.stderr.write('npm error code E404\\nENETUNREACH fixture'); process.exit(52); }
  if (process.env.FAKE_NPM_TRANSPORT === '1') { process.stderr.write('ENETUNREACH fixture'); process.exit(52); }
  const spec = args[1];
  if (state.includes(spec) || process.env.FAKE_NPM_DUPLICATE === spec) {
    process.stdout.write(JSON.stringify(spec.slice(spec.lastIndexOf('@') + 1)));
    process.exit(0);
  }
  process.stderr.write('npm error code E404\\nnpm error 404 Not Found');
  process.exit(1);
}
if (args[0] === 'publish') {
  const tarball = basename(args[1]);
  if (process.env.FAKE_NPM_PUBLISH_FAIL && tarball.includes(process.env.FAKE_NPM_PUBLISH_FAIL)) process.exit(53);
  const identities = JSON.parse(process.env.FAKE_NPM_IDENTITIES);
  const identity = identities[tarball];
  if (!identity) process.exit(54);
  state.push(identity);
  save();
  process.stdout.write('+ ' + identity);
  process.exit(0);
}
process.exit(55);
`);
  execFileSync('chmod', ['+x', join(bin, 'npm')]);
}

function Setup(lane = 'shared', mutate, options = {}) {
  const base = mkdtempSync(join(tmpdir(), 'beskid-js-publish-'));
  const root = join(base, 'repo');
  const bin = join(base, 'bin');
  const log = join(base, 'npm.log');
  const manifestLog = join(base, 'manifests.log');
  const state = join(base, 'registry.json');
  const snapshot = join(base, 'snapshot');
  mkdirSync(join(root, 'scripts/ci'), { recursive: true });
  writeFileSync(join(root, 'scripts/ci/prebuilt-javascript-publish.mjs'), readFileSync(RUNNER_SOURCE));
  writeFileSync(join(root, '.gitignore'), 'dist/\nnode_modules/\ntarget/\n');
  writeFileSync(join(root, 'fixture-root.txt'), 'clean root fixture\n');
  InitRepository(root);
  const submodule = WritePackages(root, lane, mutate);
  const nonSelectedSubmodule = options.withNonSelected ? WriteNonSelectedSubmodule(root, lane) : undefined;
  Git(root, 'add', '-A');
  Git(root, 'commit', '-qm', 'fixture root');
  WriteFakeNpm(bin);
  writeFileSync(log, '');
  writeFileSync(manifestLog, '');
  writeFileSync(state, '[]');
  const source = Git(root, 'rev-parse', 'HEAD');
  const task = lane === 'shared' ? 'shared-packages-publish' : 'treesitter-publish';
  const env = {
    ...process.env,
    PATH: `${bin}:${process.env.PATH}`,
    FAKE_NPM_LOG: log,
    FAKE_NPM_MANIFEST_LOG: manifestLog,
    FAKE_NPM_STATE: state,
    CI_PIPELINE_EVENT: 'manual',
    CI_COMMIT_BRANCH: 'main',
    CI_REPO: 'Cyber-Nomad-Collective/beskid',
    CI_COMMIT_SHA: source,
    BESKID_TASK: task,
  };
  delete env.NODE_AUTH_TOKEN;
  delete env.NPM_TOKEN;
  delete env.GITHUB_TOKEN;
  delete env.GH_TOKEN;
  return { base, root, bin, log, manifestLog, state, snapshot, source, submodule, nonSelectedSubmodule, lane, env };
}

function Run(fixture, command, extraEnv = {}) {
  return spawnSync(process.execPath, [join(fixture.root, 'scripts/ci/prebuilt-javascript-publish.mjs'), command, fixture.lane, fixture.snapshot], {
    cwd: fixture.root,
    env: { ...fixture.env, ...extraEnv },
    encoding: 'utf8',
  });
}

function Prepare(fixture) {
  const result = Run(fixture, 'prepare');
  assert.equal(result.status, 0, result.stderr);
}

function ReadLog(path) {
  const data = readFileSync(path, 'utf8').trim();
  return data ? data.split('\n').map((line) => JSON.parse(line)) : [];
}

function Cleanup(path) {
  if (!existsSync(path)) return;
  const MakeWritable = (entry) => {
    const stat = lstatSync(entry);
    if (stat.isSymbolicLink()) return;
    if (stat.isDirectory()) {
      chmodSync(entry, 0o700);
      for (const child of readdirSync(entry)) MakeWritable(join(entry, child));
    } else {
      chmodSync(entry, 0o600);
    }
  };
  MakeWritable(path);
  rmSync(path, { recursive: true, force: true });
}

function ArtifactIdentities(fixture) {
  const receipt = JSON.parse(readFileSync(join(fixture.snapshot, 'package-receipt.json'), 'utf8'));
  return Object.fromEntries(receipt.packages.map((item) => [item.tarball, `${item.name}@${item.version}`]));
}

test('prepares the fixed shared package set with exact staged sibling versions', (t) => {
  const fixture = Setup('shared');
  t.after(() => Cleanup(fixture.base));
  Prepare(fixture);
  const receipt = JSON.parse(readFileSync(join(fixture.snapshot, 'package-receipt.json'), 'utf8'));
  assert.equal(receipt.schema_version, 1);
  assert.equal(receipt.lane, 'shared');
  assert.equal(receipt.source.root_commit, fixture.source);
  assert.equal(receipt.source.submodule_path, 'beskid_web_common');
  assert.equal(receipt.packages.length, 5);
  assert.deepEqual(receipt.packages.map(({ name, version }) => [name, version]), SHARED.map(([, name, version]) => [name, version]));
  assert.ok(existsSync(join(fixture.snapshot, 'SHA256SUMS')));
  for (const item of receipt.packages) {
    const mode = Number.parseInt(statSync(join(fixture.snapshot, 'artifacts', item.tarball)).mode.toString(8).slice(-3), 10);
    assert.equal(mode, 444);
  }
  const manifests = ReadLog(fixture.manifestLog);
  const ui = manifests.find(({ name }) => name === '@cyber-nomad-collective/beskid-ui');
  assert.deepEqual(ui.dependencies, {
    '@cyber-nomad-collective/beskid-ui-react': '0.2.9',
    '@cyber-nomad-collective/trudoc': '0.2.7',
  });
  const authored = JSON.parse(readFileSync(join(fixture.root, 'beskid_web_common/packages/beskid-ui/package.json')));
  assert.equal(authored.dependencies['@cyber-nomad-collective/trudoc'], 'file:../trudoc');
  const verified = Run(fixture, 'verify');
  assert.equal(verified.status, 0, verified.stderr);
});

test('prepares the fixed Tree-sitter package without changing its identity', (t) => {
  const fixture = Setup('treesitter');
  t.after(() => Cleanup(fixture.base));
  Prepare(fixture);
  const receipt = JSON.parse(readFileSync(join(fixture.snapshot, 'package-receipt.json')));
  assert.deepEqual(receipt.packages.map(({ name, version }) => [name, version]), [[TREE[0][1], TREE[0][2]]]);
});

test('rejects unapproved identities, unstable versions, unresolved locals, and source symlinks', (t) => {
  const cases = [
    ['package identity mismatch', ({ subroot }) => {
      const path = join(subroot, 'packages/trudoc/package.json');
      const data = JSON.parse(readFileSync(path)); data.name = '@attacker/trudoc'; writeFileSync(path, JSON.stringify(data));
    }],
    ['package version must be stable', ({ subroot }) => {
      const path = join(subroot, 'packages/trudoc/package.json');
      const data = JSON.parse(readFileSync(path)); data.version = '0.2.7-beta.1'; writeFileSync(path, JSON.stringify(data));
    }],
    ['unresolved local dependency', ({ subroot }) => {
      const path = join(subroot, 'packages/trudoc/package.json');
      const data = JSON.parse(readFileSync(path)); data.dependencies = { '@other/local': 'workspace:*' }; writeFileSync(path, JSON.stringify(data));
    }],
    ['symlink in package source', ({ subroot }) => symlinkSync('built.js', join(subroot, 'packages/trudoc/dist/linked.js'))],
  ];
  for (const [message, mutate] of cases) {
    const fixture = Setup('shared', mutate);
    t.after(() => Cleanup(fixture.base));
    const result = Run(fixture, 'prepare');
    assert.notEqual(result.status, 0, message);
    assert.match(result.stderr, new RegExp(message));
  }
});

test('preparation fails closed on credentials, pack failure, and reused output', (t) => {
  const credential = Setup('shared');
  const pack = Setup('shared');
  const reused = Setup('shared');
  t.after(() => [credential, pack, reused].forEach((x) => Cleanup(x.base)));
  let result = Run(credential, 'prepare', { NODE_AUTH_TOKEN: 'preparation-secret' });
  assert.notEqual(result.status, 0); assert.match(result.stderr, /preparation must not receive publisher credentials/);
  result = Run(pack, 'prepare', { FAKE_NPM_PACK_FAIL: '1' });
  assert.notEqual(result.status, 0); assert.match(result.stderr, /npm pack failed/);
  mkdirSync(reused.snapshot);
  result = Run(reused, 'prepare');
  assert.notEqual(result.status, 0); assert.match(result.stderr, /snapshot already exists/);
});

test('verification rejects artifact and receipt tampering', (t) => {
  const artifact = Setup('treesitter');
  const receipt = Setup('shared');
  t.after(() => [artifact, receipt].forEach((x) => Cleanup(x.base)));
  Prepare(artifact);
  const item = JSON.parse(readFileSync(join(artifact.snapshot, 'package-receipt.json'))).packages[0];
  chmodSync(join(artifact.snapshot, 'artifacts'), 0o755);
  chmodSync(join(artifact.snapshot, 'artifacts', item.tarball), 0o644);
  writeFileSync(join(artifact.snapshot, 'artifacts', item.tarball), 'tampered');
  let result = Run(artifact, 'verify');
  assert.notEqual(result.status, 0); assert.match(result.stderr, /checksum mismatch/);
  Prepare(receipt);
  chmodSync(join(receipt.snapshot, 'package-receipt.json'), 0o644);
  writeFileSync(join(receipt.snapshot, 'package-receipt.json'), '{}\n');
  result = Run(receipt, 'verify');
  assert.notEqual(result.status, 0); assert.match(result.stderr, /checksum mismatch/);
});

test('verification rejects unexpected or linked snapshot inventory', (t) => {
  const extra = Setup('treesitter');
  const linked = Setup('treesitter');
  t.after(() => [extra, linked].forEach((x) => Cleanup(x.base)));
  Prepare(extra);
  chmodSync(extra.snapshot, 0o755);
  writeFileSync(join(extra.snapshot, 'unexpected.txt'), 'not part of the receipt');
  let result = Run(extra, 'verify');
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /snapshot contains an unexpected entry/);
  Prepare(linked);
  chmodSync(linked.snapshot, 0o755);
  symlinkSync('package-receipt.json', join(linked.snapshot, 'unexpected-link'));
  result = Run(linked, 'verify');
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /snapshot contains an unexpected entry/);
});

test('all commands reject the wrong manual main repository and source context', (t) => {
  const fixture = Setup('treesitter');
  t.after(() => Cleanup(fixture.base));
  const cases = [
    { CI_PIPELINE_EVENT: 'push' },
    { CI_COMMIT_BRANCH: 'other' },
    { CI_REPO: 'other/repo' },
    { CI_COMMIT_SHA: '0'.repeat(40) },
    { BESKID_TASK: 'shared-packages-publish' },
  ];
  for (const changed of cases) {
    const result = Run(fixture, 'prepare', changed);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /trusted Woodpecker/);
  }
});

test('all commands reject tracked and untracked root contamination between stages', (t) => {
  for (const command of ['prepare', 'verify', 'publish']) {
    for (const contamination of ['tracked', 'untracked']) {
      const fixture = Setup('treesitter');
      t.after(() => Cleanup(fixture.base));
      if (command !== 'prepare') Prepare(fixture);
      if (contamination === 'tracked') {
        writeFileSync(join(fixture.root, 'fixture-root.txt'), `${command} tracked contamination\n`);
      } else {
        writeFileSync(join(fixture.root, 'root-contamination.txt'), `${command} untracked contamination\n`);
      }
      const extraEnv = command === 'publish'
        ? { NODE_AUTH_TOKEN: 'x', FAKE_NPM_IDENTITIES: JSON.stringify(ArtifactIdentities(fixture)) }
        : {};
      const result = Run(fixture, command, extraEnv);
      assert.notEqual(result.status, 0, `${command} accepted ${contamination} root contamination`);
      assert.match(result.stderr, /root source must be clean before packaging/);
      assert.equal(ReadLog(fixture.log).filter(({ args }) => args[0] === 'publish').length, 0);
    }
  }
});

test('all commands accept ignored build outputs with a clean initialized non-selected submodule', (t) => {
  const fixture = Setup('treesitter', undefined, { withNonSelected: true });
  t.after(() => Cleanup(fixture.base));
  mkdirSync(join(fixture.root, 'dist'), { recursive: true });
  writeFileSync(join(fixture.root, 'dist', 'root-build-output.js'), 'ignored root build output\n');
  mkdirSync(join(fixture.root, fixture.nonSelectedSubmodule, 'node_modules'), { recursive: true });
  writeFileSync(join(fixture.root, fixture.nonSelectedSubmodule, 'node_modules', 'dependency.txt'), 'ignored dependency tree\n');
  mkdirSync(join(fixture.root, fixture.nonSelectedSubmodule, 'dist'), { recursive: true });
  writeFileSync(join(fixture.root, fixture.nonSelectedSubmodule, 'dist', 'built.js'), 'ignored non-selected build output\n');
  let result = Run(fixture, 'prepare');
  assert.equal(result.status, 0, result.stderr);
  result = Run(fixture, 'verify');
  assert.equal(result.status, 0, result.stderr);
  result = Run(fixture, 'publish', {
    NODE_AUTH_TOKEN: 'x',
    FAKE_NPM_IDENTITIES: JSON.stringify(ArtifactIdentities(fixture)),
  });
  assert.equal(result.status, 0, result.stderr);
});

test('preparation rejects tracked and untracked changes in an initialized non-selected submodule', (t) => {
  for (const contamination of ['tracked', 'untracked']) {
    const fixture = Setup('treesitter', undefined, { withNonSelected: true });
    t.after(() => Cleanup(fixture.base));
    const subroot = join(fixture.root, fixture.nonSelectedSubmodule);
    if (contamination === 'tracked') {
      writeFileSync(join(subroot, 'README.md'), 'tracked non-selected contamination\n');
    } else {
      writeFileSync(join(subroot, 'unexpected.txt'), 'untracked non-selected contamination\n');
    }
    const result = Run(fixture, 'prepare');
    assert.notEqual(result.status, 0, `prepare accepted ${contamination} non-selected submodule contamination`);
    assert.match(result.stderr, /root source must be clean before packaging/);
  }
});

test('publishes only verified prebuilt tarballs with ignored lifecycle scripts', (t) => {
  const fixture = Setup('shared');
  t.after(() => Cleanup(fixture.base));
  Prepare(fixture);
  writeFileSync(fixture.log, '');
  const identities = ArtifactIdentities(fixture);
  const secret = 'fixture-super-secret-token';
  const result = Run(fixture, 'publish', { NODE_AUTH_TOKEN: secret, FAKE_NPM_IDENTITIES: JSON.stringify(identities) });
  assert.equal(result.status, 0, result.stderr);
  const log = ReadLog(fixture.log);
  const publishes = log.filter(({ args }) => args[0] === 'publish');
  assert.equal(publishes.length, 5);
  for (const entry of publishes) {
    assert.deepEqual(entry.args.slice(2), ['--ignore-scripts', `--registry=${REGISTRY}`, '--access', 'public', '--provenance=false']);
    assert.equal(entry.credential, true);
    assert.ok(entry.args[1].startsWith(join(fixture.snapshot, 'artifacts') + '/'));
  }
  const results = JSON.parse(readFileSync(join(fixture.snapshot, 'publish-results.json')));
  assert.equal(results.length, 5);
  assert.ok(results.every(({ status }) => status === 'published'));
  assert.ok(!readFileSync(fixture.log, 'utf8').includes(secret));
  for (const file of readdirSync(fixture.snapshot)) {
    if (file !== 'artifacts') assert.ok(!readFileSync(join(fixture.snapshot, file), 'utf8').includes(secret));
  }
});

test('publication rejects missing credentials, duplicate versions, and ambiguous registry errors before upload', (t) => {
  const missing = Setup('treesitter');
  const duplicate = Setup('treesitter');
  const transport = Setup('treesitter');
  const mixed = Setup('treesitter');
  t.after(() => [missing, duplicate, transport, mixed].forEach((x) => Cleanup(x.base)));
  for (const fixture of [missing, duplicate, transport, mixed]) Prepare(fixture);
  let result = Run(missing, 'publish', { FAKE_NPM_IDENTITIES: JSON.stringify(ArtifactIdentities(missing)) });
  assert.notEqual(result.status, 0); assert.match(result.stderr, /NODE_AUTH_TOKEN is missing/);
  const spec = `${TREE[0][1]}@${TREE[0][2]}`;
  result = Run(duplicate, 'publish', { NODE_AUTH_TOKEN: 'x', FAKE_NPM_DUPLICATE: spec, FAKE_NPM_IDENTITIES: JSON.stringify(ArtifactIdentities(duplicate)) });
  assert.notEqual(result.status, 0); assert.match(result.stderr, /already exists/);
  assert.equal(ReadLog(duplicate.log).filter(({ args }) => args[0] === 'publish').length, 0);
  result = Run(transport, 'publish', { NODE_AUTH_TOKEN: 'x', FAKE_NPM_TRANSPORT: '1', FAKE_NPM_IDENTITIES: JSON.stringify(ArtifactIdentities(transport)) });
  assert.notEqual(result.status, 0); assert.match(result.stderr, /registry read failed/);
  assert.equal(ReadLog(transport.log).filter(({ args }) => args[0] === 'publish').length, 0);
  result = Run(mixed, 'publish', { NODE_AUTH_TOKEN: 'x', FAKE_NPM_MIXED_ERROR: '1', FAKE_NPM_IDENTITIES: JSON.stringify(ArtifactIdentities(mixed)) });
  assert.notEqual(result.status, 0); assert.match(result.stderr, /registry read failed/);
  assert.equal(ReadLog(mixed.log).filter(({ args }) => args[0] === 'publish').length, 0);
});

test('publication retains honest partial results after an upload failure', (t) => {
  const fixture = Setup('shared');
  t.after(() => Cleanup(fixture.base));
  Prepare(fixture);
  const result = Run(fixture, 'publish', {
    NODE_AUTH_TOKEN: 'x',
    FAKE_NPM_IDENTITIES: JSON.stringify(ArtifactIdentities(fixture)),
    FAKE_NPM_PUBLISH_FAIL: 'beskid-ui-0.2.8',
  });
  assert.notEqual(result.status, 0); assert.match(result.stderr, /npm publish failed/);
  const results = JSON.parse(readFileSync(join(fixture.snapshot, 'publish-results.json')));
  assert.deepEqual(results.map(({ status }) => status), ['published', 'failed']);
  assert.equal(results[1].name, '@cyber-nomad-collective/beskid-ui');
  assert.equal(ReadLog(fixture.log).filter(({ args }) => args[0] === 'publish').length, 2);
});
