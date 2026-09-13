import assert from "node:assert/strict";
import test from "node:test";
import { spawnSync } from "node:child_process";
const script = new URL("../release-version.mjs", import.meta.url).pathname;
test("stable ordering is numeric and refuses prerelease input", () => {
  for (const [next, current, expected] of [["0.4.10", "0.4.9", "1"], ["0.4.8", "0.4.9", "-1"], ["1.0.0", "1.0.0", "0"], ["100000000000000000000.0.0", "9.0.0", "1"]]) {
    const result = spawnSync(process.execPath, [script, "--compare-stable", next, current], { encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout.trim(), expected);
  }
  const invalid = spawnSync(process.execPath, [script, "--compare-stable", "0.4.0-rc.1", "0.4.0"], { encoding: "utf8" });
  assert.notEqual(invalid.status, 0);
});
