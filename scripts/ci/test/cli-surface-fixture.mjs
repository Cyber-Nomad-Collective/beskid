// Complete synthetic report for root release contract tests. No CLI is run here.
import { EXPECTED_ROWS } from "../cli-surface-inventory.mjs";

export function cliSurfaceFixture(binary, binarySha, corelibFingerprint) {
  const rows = [...EXPECTED_ROWS].map(([path, [kind, status]]) => {
    const row = { path, kind, status };
    if (status === "pass") Object.assign(row, { exit: 0, expected_exit: 0, control_bytes: [], marker_seen: true });
    if (status === "setup_skip") row.reason = "requires isolated setup fixture";
    if (path === "graph --tui") Object.assign(row, { timed_out: false, rendered_project: true, transcript_base64: "dHVp" });
    if (path === "analyze --plain PTY") Object.assign(row, { timed_out: false, line_output: true, summary_seen: true, transcript_base64: "bGluZQ==" });
    return row;
  });
  return {
    schema: "beskid.cli-surface.v1", binary, binary_sha256: binarySha,
    corelib_fingerprint: corelibFingerprint,
    source_provenance: { status: "unverified", commit: null, external_receipt_required: true },
    release_qualified: false,
    counts: { pass: 54, fail: 0, setup_skip: 18, uncovered: 0, inventory_only: 13 },
    contracts: {
      hi_unknown: { exit: 2, unknown_subcommand: true, control_bytes: [] },
      new_tui_rejected: { exit: 2, not_advertised: true, unexpected_argument: true, control_bytes: [] },
      graph_tui_advertised: true,
    },
    rows,
  };
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  if (process.argv.length !== 5) process.exit(2);
  process.stdout.write(`${JSON.stringify(cliSurfaceFixture(...process.argv.slice(2)))}\n`);
}
