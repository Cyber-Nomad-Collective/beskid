import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const validatorPath = new URL("../check-license-policy.mjs", import.meta.url);

function createFixture({ declaredLicense = "Apache-2.0", includeLicenseText = true } = {}) {
  const root = mkdtempSync(join(tmpdir(), "beskid-license-policy-"));
  mkdirSync(join(root, "LICENSES"));
  mkdirSync(join(root, "packages", "tool"), { recursive: true });
  writeFileSync(
    join(root, "license-policy.json"),
    JSON.stringify({
      schemaVersion: 1,
      licenses: { "Apache-2.0": "LICENSES/Apache-2.0.txt" },
      packages: [{ path: "packages/tool/package.json", license: "Apache-2.0" }],
    }),
  );
  writeFileSync(
    join(root, "packages", "tool", "package.json"),
    JSON.stringify({ name: "tool", license: declaredLicense }),
  );
  if (includeLicenseText) {
    writeFileSync(join(root, "LICENSES", "Apache-2.0.txt"), "Apache License\n");
  }
  return root;
}

function runValidator(root) {
  return spawnSync(process.execPath, [validatorPath.pathname, "--root", root], {
    encoding: "utf8",
  });
}

test("accepts packages whose declared license matches policy", (t) => {
  const root = createFixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));

  const result = runValidator(root);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /license policy valid: 1 package/);
});

test("rejects a package whose declared license drifts from policy", (t) => {
  const root = createFixture({ declaredLicense: "MIT" });
  t.after(() => rmSync(root, { recursive: true, force: true }));

  const result = runValidator(root);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /packages\/tool\/package\.json: expected Apache-2\.0, found MIT/);
});

test("rejects policy entries whose legal text is missing", (t) => {
  const root = createFixture({ includeLicenseText: false });
  t.after(() => rmSync(root, { recursive: true, force: true }));

  const result = runValidator(root);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /missing license text LICENSES\/Apache-2\.0\.txt/);
});
