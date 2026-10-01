import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { test } from "node:test";
import { runTemplateQualityGate } from "../lib/template-quality-gate.mjs";

const members = ["console", "lib", "project", "workspace_demo", "contract_item", "host", "fiber_demo"];

function fixture(script) {
  const root = mkdtempSync(join(tmpdir(), "beskid-template-gate-test-"));
  const templatesRoot = join(root, "templates");
  const corelibRoot = join(root, "corelib");
  mkdirSync(join(templatesRoot, "ci"), { recursive: true });
  mkdirSync(corelibRoot);
  writeFileSync(join(templatesRoot, "ci", "quality.py"), script);
  return { root, templatesRoot, corelibRoot };
}

test("rejects a static-only template checker despite its exit zero", () => {
  const paths = fixture(`print("quality OK: 7 template member(s)")\n`);
  try {
    assert.throws(
      () => runTemplateQualityGate("/definitely/missing/beskid", paths.templatesRoot, paths.corelibRoot),
      /did not report generated-output verification/,
    );
  } finally {
    rmSync(paths.root, { recursive: true, force: true });
  }
});

test("accepts complete generated-output evidence with a relative template root and no credentials", () => {
  const paths = fixture(`import os\nprint("quality fixture: intentionally invalid .bd rejected [parser]")\n${members.map((member) => `print("quality result: ${member}: PASS")`).join("\n")}\nprint("quality OK: 7 generated template member(s)")\nprint("credential-present=" + str("BESKID_PCKG_API_KEY" in os.environ))\n`);
  try {
    const output = runTemplateQualityGate("/definitely/missing/beskid", relative(process.cwd(), paths.templatesRoot), paths.corelibRoot, {
      ...process.env,
      BESKID_PCKG_API_KEY: "private-test-value",
      GH_TOKEN: "private-test-value",
    });
    assert.match(output, /credential-present=False/);
  } finally {
    rmSync(paths.root, { recursive: true, force: true });
  }
});

test("rejects zero-exit checkers missing one template result or invalid-fixture proof", () => {
  const paths = fixture(`print("quality OK: 7 generated template member(s)")\n`);
  try {
    assert.throws(
      () => runTemplateQualityGate("/definitely/missing/beskid", paths.templatesRoot, paths.corelibRoot),
      /did not report generated-output verification/,
    );
  } finally {
    rmSync(paths.root, { recursive: true, force: true });
  }
});
