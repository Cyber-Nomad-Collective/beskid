import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

const TEMPLATE_MEMBER_IDS = [
  "console", "lib", "project", "workspace_demo", "contract_item", "host", "fiber_demo",
];

// The template checker executes the candidate compiler, but has no reason to
// receive publisher or release credentials from the manual publication job.
const PASSTHROUGH_ENV = [
  "PATH", "HOME", "TMPDIR", "TEMP", "TMP", "LANG", "LC_ALL",
  "LD_LIBRARY_PATH", "DYLD_LIBRARY_PATH", "RUST_MIN_STACK",
  "BESKID_RUNTIME_PREFIX", "XDG_CACHE_HOME",
];

export function runTemplateQualityGate(cliBin, templatesRoot, corelibRoot, environment = process.env) {
  const workspace = resolve(templatesRoot);
  const script = join(workspace, "ci", "quality.py");
  if (!existsSync(script)) {
    throw new Error(`First-party template quality gate is missing: ${script}`);
  }
  const childEnv = Object.fromEntries(
    PASSTHROUGH_ENV.filter((key) => environment[key] !== undefined)
      .map((key) => [key, environment[key]]),
  );
  childEnv.BESKID_CORELIB_ROOT = resolve(corelibRoot);
  const result = spawnSync("python3", [script, "--cli", resolve(cliBin), "--verify-invalid-fixture"], {
    cwd: workspace,
    env: childEnv,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  });
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  if (result.error || result.status !== 0) {
    throw new Error(`First-party template quality gate failed: ${result.error?.message ?? `exit ${result.status}`}\n${output}`);
  }
  const required = [
    "quality fixture: intentionally invalid .bd rejected [parser]",
    ...TEMPLATE_MEMBER_IDS.map((member) => `quality result: ${member}: PASS`),
    `quality OK: ${TEMPLATE_MEMBER_IDS.length} generated template member(s)`,
  ];
  const missing = required.filter((marker) => !output.split(/\r?\n/).includes(marker));
  if (missing.length) {
    throw new Error(`First-party template checker did not report generated-output verification: ${missing.join(", ")}\n${output}`);
  }
  return output;
}
