// Validate the release evidence of one platform exactly as its build checksummed it.
//
// A build output directory may hold files written after its SHA256SUMS (the Linux release gate
// reports), which the strict packet-closure check of woodpecker-release-evidence.mjs rejects. The
// release collector validates a packet-only view (the files SHA256SUMS lists plus SHA256SUMS); the
// packaging and repackaging steps validate the same view, built in a private temporary directory.
import { spawnSync } from "node:child_process";
import { copyFileSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scripts = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// The validated evidence JSON of `<evidenceRoot>/<platform>`; throws with the validator's message.
export function ValidatePacketEvidence(evidenceRoot, platform) {
  const packetRoot = mkdtempSync(join(tmpdir(), "beskid-packet-evidence-"));
  try {
    const source = join(evidenceRoot, platform);
    const packet = join(packetRoot, platform);
    mkdirSync(packet);
    copyFileSync(join(source, "SHA256SUMS"), join(packet, "SHA256SUMS"));
    for (const line of readFileSync(join(source, "SHA256SUMS"), "utf8").split(/\r?\n/).filter(Boolean)) {
      const name = line.slice(66);
      let regular = false;
      try { regular = lstatSync(join(source, name)).isFile(); } catch { regular = false; }
      if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(name) || !regular) throw new Error(`invalid release evidence: packet entry ${name} is not a regular file`);
      copyFileSync(join(source, name), join(packet, name));
    }
    const result = spawnSync(process.execPath, [join(scripts, "woodpecker-release-evidence.mjs"), packetRoot, platform], { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
    if (result.error || result.status !== 0) throw new Error(`invalid release evidence: ${result.error?.message || result.stderr.trim()}`);
    return JSON.parse(result.stdout);
  } finally {
    rmSync(packetRoot, { recursive: true, force: true });
  }
}
