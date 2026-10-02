import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const scripts = resolve(dirname(fileURLToPath(import.meta.url)), '..');
function Put(path, content, mode) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content, { mode });
}
function Run(command, args, options = {}) {
  return spawnSync(command, args, { encoding: 'utf8', timeout: 10000, ...options });
}
function Fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'beskid-qualified-pckg-')));
  const repo = join(root, 'repo'), prefix = join(root, 'qualified'), bin = join(root, 'tools');
  const fixtureScripts = join(repo, 'scripts/ci');
  mkdirSync(fixtureScripts, { recursive: true });
  for (const name of ['corelib-publish.sh', 'verify-release-corelib-bundle.mjs', 'release-version.mjs']) cpSync(join(scripts, name), join(fixtureScripts, name));
  Put(join(repo, 'compiler/corelib/CoreLib.bws'), 'workspace { name = "corelib" }\n');
  Put(join(repo, 'compiler/corelib/beskid_corelib/corelib.bproj'), 'project { name = "corelib" }\n');
  Put(join(repo, 'compiler/corelib/packages/foundation/Src/Main.bd'), '// canonical fixture\n');
  cpSync(join(repo, 'compiler/corelib'), join(prefix, 'beskid_corelib'), { recursive: true });
  const hash = Run(process.execPath, [join(scripts, 'verify-release-corelib-bundle.mjs'), '--fingerprint', join(prefix, 'beskid_corelib')]);
  assert.equal(hash.status, 0, hash.stderr);
  Put(join(prefix, 'beskid_corelib/.beskid-bundle.sha256'), hash.stdout);
  Put(join(prefix, 'release-version.txt'), '0.5.1\n');
  Put(join(prefix, 'bin/beskid'), '#!/usr/bin/env bash\n[[ "$1" == --version ]] || exit 99\necho "beskid 0.5.1"\n', 0o755);
  for (const profile of ['debug', 'release']) Put(join(prefix, `lib/beskid-runtime/abi-5/x86_64-unknown-linux-gnu/${profile}/abi.json`), '{}\n');
  Put(join(fixtureScripts, 'lib/corelib-publish-runner.mjs'), `import {writeFileSync} from 'node:fs';\nwriteFileSync(process.env.RECEIPT,JSON.stringify(Object.fromEntries(['BESKID_CLI_BIN','BESKID_CORELIB_ROOT','BESKID_RUNTIME_PREFIX'].map(k=>[k,process.env[k]]))));\n`);
  Put(join(repo, 'beskid_templates/beskid_templates.bws'), 'fixture\n');
  Put(join(bin, 'cargo'), '#!/usr/bin/env bash\necho "unexpected Cargo fallback" >&2\nexit 99\n', 0o755);
  Put(join(bin, 'uname'), '#!/usr/bin/env bash\ncase "$1" in -m) echo x86_64 ;; -s) echo Linux ;; *) exit 99 ;; esac\n', 0o755);
  const receipt = join(root, 'receipt.json');
  const env = { PATH: `${bin}:${process.env.PATH}`, HOME: root, RECEIPT: receipt,
    BESKID_TOOLCHAIN_PREFIX: prefix, BESKID_CLI_BIN: join(prefix, 'bin/beskid') };
  const run = (overrides = {}) => Run('bash', [join(fixtureScripts, 'corelib-publish.sh'), 'patch', '--dry-run'], { env: { ...env, ...overrides } });
  return { root, prefix, repo, receipt, run };
}

test('publisher derives every execution root from the qualified prefix, never the authored checkout', () => {
  const f = Fixture();
  try {
    const result = f.run();
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(JSON.parse(readFileSync(f.receipt)), {
      BESKID_CLI_BIN: join(f.prefix, 'bin/beskid'),
      BESKID_CORELIB_ROOT: join(f.prefix, 'beskid_corelib'),
      BESKID_RUNTIME_PREFIX: f.prefix,
    });
  } finally { rmSync(f.root, { recursive: true, force: true }); }
});

test('publisher refuses the old raw-CLI route instead of packing or invoking Cargo', () => {
  const f = Fixture();
  try {
    const result = f.run({ BESKID_TOOLCHAIN_PREFIX: '', BESKID_CLI_BIN: join(f.prefix, 'bin/beskid') });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /BESKID_TOOLCHAIN_PREFIX/);
    assert.equal(existsSync(f.receipt), false);
  } finally { rmSync(f.root, { recursive: true, force: true }); }
});

for (const [name, damage] of [
  ['missing runtime kit', f => rmSync(join(f.prefix, 'lib'), { recursive: true })],
  ['Corelib source mismatch', f => Put(join(f.prefix, 'beskid_corelib/packages/foundation/Src/Main.bd'), '// foreign\n')],
  ['conflicting Corelib override', f => ({ BESKID_CORELIB_ROOT: join(f.repo, 'compiler/corelib') })],
  ['malformed release version file', f => Put(join(f.prefix, 'release-version.txt'), '0.\n5.1\n')],
]) test(`publisher rejects ${name} before invoking the runner`, () => {
  const f = Fixture();
  try {
    const overrides = damage(f) ?? {};
    const result = f.run(overrides);
    assert.notEqual(result.status, 0, result.stdout);
    assert.equal(existsSync(f.receipt), false);
  } finally { rmSync(f.root, { recursive: true, force: true }); }
});

function DownloadFixture({ digest = 'valid', linked = false } = {}) {
  const f = Fixture();
  const asset = 'beskid-0.5.1-x86_64-unknown-linux-gnu.tar.gz';
  const payload = join(f.root, asset.slice(0, -7));
  cpSync(f.prefix, payload, { recursive: true });
  for (const name of ['beskid_lsp', 'beskid-up']) Put(join(payload, 'bin', name), '#!/usr/bin/env bash\nexit 0\n', 0o755);
  if (linked) {
    const link = Run('ln', ['-s', '/outside-fixture', join(payload, 'escape')]);
    assert.equal(link.status, 0, link.stderr);
  }
  const archive = join(f.root, asset);
  const tar = Run('tar', ['-czf', archive, '-C', f.root, asset.slice(0, -7)]);
  assert.equal(tar.status, 0, tar.stderr);
  const sha = createHash('sha256').update(readFileSync(archive)).digest('hex');
  const tools = join(f.root, 'download-tools');
  Put(join(tools, 'gh'), `#!${process.execPath}\nconst {copyFileSync}=require('node:fs');\nconst {join}=require('node:path');\nconst args=process.argv.slice(2);\nif(args[0]==='api' && args[1]==='repos/Cyber-Nomad-Collective/beskid_compiler/releases/tags/v0.5.1'){ console.log(process.env.FIXTURE_DIGEST); }\nelse if(args[0]==='release' && args[1]==='download' && args[2]==='v0.5.1' && args[args.indexOf('--pattern')+1]===${JSON.stringify(asset)} && args[args.indexOf('--repo')+1]==='Cyber-Nomad-Collective/beskid_compiler'){copyFileSync(process.env.FIXTURE_ARCHIVE,join(args[args.indexOf('--dir')+1],${JSON.stringify(asset)}));}\nelse { console.error('unexpected immutable download request: '+JSON.stringify(args)); process.exit(99); }\n`, 0o755);
  const destination = join(f.root, 'downloaded-prefix');
  const result = Run(process.execPath, [join(scripts, 'prepare-pckg-toolchain.mjs'), '0.5.1', destination], {
    env: { PATH: `${tools}:${process.env.PATH}`, HOME: f.root, FIXTURE_ARCHIVE: archive,
      FIXTURE_DIGEST: digest === 'valid' ? `sha256:${sha}` : digest === 'wrong' ? `sha256:${'0'.repeat(64)}` : 'null' },
  });
  return { ...f, destination, result };
}

test('immutable bundle download verifies its digest and extracts the complete installed prefix', () => {
  const f = DownloadFixture();
  try {
    assert.equal(f.result.status, 0, f.result.stderr);
    assert.equal(readFileSync(join(f.destination, 'release-version.txt'), 'utf8'), '0.5.1\n');
    for (const file of ['bin/beskid', 'bin/beskid_lsp', 'bin/beskid-up', 'beskid_corelib/.beskid-bundle.sha256',
      'lib/beskid-runtime/abi-5/x86_64-unknown-linux-gnu/debug/abi.json',
      'lib/beskid-runtime/abi-5/x86_64-unknown-linux-gnu/release/abi.json']) assert.ok(existsSync(join(f.destination, file)), file);
  } finally { rmSync(f.root, { recursive: true, force: true }); }
});

for (const digest of ['wrong', 'missing']) test(`immutable bundle download rejects a ${digest} release digest before extraction`, () => {
  const f = DownloadFixture({ digest });
  try {
    assert.notEqual(f.result.status, 0);
    assert.match(f.result.stderr, /digest/);
    assert.equal(existsSync(f.destination), false);
  } finally { rmSync(f.root, { recursive: true, force: true }); }
});

test('a digest-matching archive with a link is rejected by the pinned distribution extractor', () => {
  const f = DownloadFixture({ linked: true });
  try {
    assert.notEqual(f.result.status, 0);
    assert.match(f.result.stderr, /linked or special entry/);
    assert.equal(existsSync(f.destination), false);
  } finally { rmSync(f.root, { recursive: true, force: true }); }
});
