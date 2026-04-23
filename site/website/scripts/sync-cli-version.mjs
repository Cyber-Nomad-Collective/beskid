/**
 * Writes src/data/cli-version.json for the docs build.
 * Prefers GitHub rolling release cli-version.txt; falls back to compiler/crates/beskid_cli/Cargo.toml in a superrepo checkout.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const websiteRoot = join(__dirname, "..");
const outPath = join(websiteRoot, "src", "data", "cli-version.json");
const cargoPath = join(websiteRoot, "..", "..", "compiler", "crates", "beskid_cli", "Cargo.toml");

const ROLLING_URL =
  "https://github.com/Cyber-Nomad-Collective/beskid_compiler/releases/download/cli-latest/cli-version.txt";

function readVersionFromCargo() {
  const text = readFileSync(cargoPath, "utf8");
  const m = text.match(/^version\s*=\s*"([^"]+)"/m);
  if (!m) {
    throw new Error(`Could not parse package version in ${cargoPath}`);
  }
  return m[1].trim();
}

async function tryFetchRolling() {
  const res = await fetch(ROLLING_URL, { redirect: "follow" });
  if (!res.ok) {
    return null;
  }
  const raw = (await res.text()).trim();
  if (!raw) {
    return null;
  }
  return { version: raw, source: "github" };
}

function tryLocalCargo() {
  try {
    return { version: readVersionFromCargo(), source: "local" };
  } catch {
    return null;
  }
}

async function main() {
  const fromGitHub = await tryFetchRolling();
  const payload = fromGitHub ?? tryLocalCargo();

  if (!payload) {
    console.error(
      "sync-cli-version: could not read rolling version from GitHub and no local compiler/crates/beskid_cli/Cargo.toml was found.",
    );
    console.error(`  Tried: ${ROLLING_URL}`);
    console.error(`  Tried: ${cargoPath}`);
    process.exit(1);
  }

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`sync-cli-version: wrote ${outPath} (${payload.source}: ${payload.version})`);
}

await main();
