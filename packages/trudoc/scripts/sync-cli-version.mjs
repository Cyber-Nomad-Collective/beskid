/**
 * Sync rolling CLI semver: cli-version.json for the docs site and beskid_cli Cargo.toml.
 * Prefers GitHub cli-latest/cli-version.txt; falls back to local Cargo.toml.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { getWebsiteRoot } from "./lib/website-root.mjs";

const websiteRoot = getWebsiteRoot(import.meta.url);
const outPath = join(websiteRoot, "src", "data", "cli-version.json");
const vscodeOutPath = join(websiteRoot, "src", "data", "vscode-extension.json");
const cargoPath = join(websiteRoot, "..", "..", "compiler", "crates", "beskid_cli", "Cargo.toml");
const vscodePkgPath = join(websiteRoot, "..", "..", "beskid_vscode", "package.json");

const ROLLING_URL =
  "https://github.com/Cyber-Nomad-Collective/beskid_compiler/releases/download/cli-latest/cli-version.txt";
const OPEN_VSX_URL = "https://open-vsx.org/api/beskid/beskid-vscode/latest";

function readVersionFromCargo() {
  const text = readFileSync(cargoPath, "utf8");
  const m = text.match(/^version\s*=\s*"([^"]+)"/m);
  if (!m) {
    throw new Error(`Could not parse package version in ${cargoPath}`);
  }
  return m[1].trim();
}

function writeCargoVersion(version) {
  if (!existsSync(cargoPath)) {
    return false;
  }
  const text = readFileSync(cargoPath, "utf8");
  const next = text.replace(/^version\s*=\s*"[^"]+"/m, `version = "${version}"`);
  if (next === text) {
    return false;
  }
  writeFileSync(cargoPath, next, "utf8");
  return true;
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

function readVersionFromVscodePkg() {
  const text = readFileSync(vscodePkgPath, "utf8");
  const data = JSON.parse(text);
  if (typeof data.version !== "string" || !data.version.trim()) {
    throw new Error(`Could not parse version in ${vscodePkgPath}`);
  }
  return data.version.trim();
}

async function tryFetchOpenVsx() {
  const res = await fetch(OPEN_VSX_URL, { redirect: "follow" });
  if (!res.ok) {
    return null;
  }
  const data = await res.json();
  const version = typeof data.version === "string" ? data.version.trim() : "";
  if (!version) {
    return null;
  }
  return { version, source: "open-vsx" };
}

function tryLocalVscodePkg() {
  try {
    return { version: readVersionFromVscodePkg(), source: "local" };
  } catch {
    return null;
  }
}

async function main() {
  const fromGitHub = await tryFetchRolling();
  const payload = fromGitHub ?? tryLocalCargo();

  mkdirSync(dirname(outPath), { recursive: true });

  if (!payload) {
    const fallback = { version: "latest", source: "fallback" };
    console.warn(
      "sync-cli-version: could not read rolling version from GitHub and no local compiler/crates/beskid_cli/Cargo.toml was found; using fallback version.",
    );
    console.warn(`  Tried: ${ROLLING_URL}`);
    console.warn(`  Tried: ${cargoPath}`);
    writeFileSync(outPath, `${JSON.stringify(fallback, null, 2)}\n`, "utf8");
    console.log(`sync-cli-version: wrote ${outPath} (${fallback.source}: ${fallback.version})`);
  } else {
    writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
    console.log(`sync-cli-version: wrote ${outPath} (${payload.source}: ${payload.version})`);
    if (writeCargoVersion(payload.version)) {
      console.log(`sync-cli-version: updated ${cargoPath} → ${payload.version}`);
    }
  }

  const vscodePayload = (await tryFetchOpenVsx()) ?? tryLocalVscodePkg();
  if (!vscodePayload) {
    const vscodeFallback = { version: "latest", source: "fallback" };
    writeFileSync(vscodeOutPath, `${JSON.stringify(vscodeFallback, null, 2)}\n`, "utf8");
    console.warn("sync-cli-version: could not read Open VSX or local beskid_vscode/package.json");
    console.log(`sync-cli-version: wrote ${vscodeOutPath} (${vscodeFallback.source}: ${vscodeFallback.version})`);
    return;
  }

  writeFileSync(vscodeOutPath, `${JSON.stringify(vscodePayload, null, 2)}\n`, "utf8");
  console.log(`sync-cli-version: wrote ${vscodeOutPath} (${vscodePayload.source}: ${vscodePayload.version})`);
}

await main();
