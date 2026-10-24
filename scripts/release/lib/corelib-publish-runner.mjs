#!/usr/bin/env node
/**
 * Pack and publish the production corelib closure plus first-party templates.
 *
 * Run by scripts/release/publish-corelib.sh from the Mac; no pipeline lane
 * holds the registry key. The corelib publish set is derived from the members
 * of CoreLib.bws minus the explicit EXCLUDED_CORELIB_MEMBERS list. The version
 * policy is BESKID_PCKG_VERSION_BUMP: patch (default), minor, major or an exact
 * MAJOR.MINOR.PATCH version.
 *
 * Before the first registry write the runner checks, in this order: tags are
 * unique per package; the key's subject (asked of the registry) owns every
 * existing package; every planned version is newer than the published one (or
 * equals it, which marks the package as already published); every artifact
 * packs and validates, API docs included. A package already published at its
 * planned version is skipped, so an interrupted run resumes from registry state.
 *
 * Set BESKID_PUBLISH_DRY_RUN=1 to run all checks and packs without any write.
 */
import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, join } from "node:path";
import { pathToFileURL } from "node:url";
import { tmpdir } from "node:os";
import { runTemplateQualityGate } from "../../ci/lib/template-quality-gate.mjs";

const CORELIB_REPOSITORY_BASE =
  "https://github.com/Cyber-Nomad-Collective/beskid_compiler/tree/main/corelib";
const TEMPLATES_REPOSITORY_BASE =
  "https://github.com/Cyber-Nomad-Collective/beskid_templates/tree/main";

// Workspace members that must never be published, each with its reason. Every
// other member of CoreLib.bws is published. An entry that names no workspace
// member fails, so this list cannot go stale.
//
// Mods: `serialization_mod` is published. `corelib_serialization` (and through
// it the aggregate) depends on it, and every dependency of a published package
// must be in the plan; to a consumer a Mod is an ordinary registry dependency.
// The previous design excluded only the development generator below.
export const EXCLUDED_CORELIB_MEMBERS = new Map([
  // Test project (category Test, the workspace defaultTestMember); no consumer depends on it.
  ["corelib_tests", "test project"],
  // Development Mod that generates Pest parsers inside the Corelib repository; no published package depends on it.
  ["corelib_pest_gen", "development Mod of the Corelib repository"],
  // BSOL schema of the corelib_pest_gen tunables; it exists only for that development Mod.
  ["pest_gen_schema", "schema of the corelib_pest_gen development Mod"],
]);
const TEMPLATE_MEMBER_IDS = [
  "console",
  "lib",
  "project",
  "workspace_demo",
  "contract_item",
  "host",
  "fiber_demo",
];

function requireEnv(name) {
  const value = (process.env[name] ?? "").trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function enabled(name) {
  return ["1", "true", "yes"].includes(
    (process.env[name] ?? "").trim().toLowerCase(),
  );
}

function projectField(content, key) {
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const eq = trimmed.indexOf("=");
    if (trimmed.slice(0, eq).trim() !== key) continue;
    return trimmed.slice(eq + 1).trim().replace(/^"/, "").replace(/"$/, "");
  }
  return null;
}

function parseTags(raw, context) {
  try {
    const tags = JSON.parse(raw ?? "null");
    if (!Array.isArray(tags) || tags.some((tag) => typeof tag !== "string")) {
      throw new Error("tags must be a string array");
    }
    return tags;
  } catch (error) {
    throw new Error(`${context}: invalid tags: ${error.message}`);
  }
}

function parseWorkspaceMembers(content, context) {
  const members = new Map();
  const pattern = /member\s+"([^"]+)"\s*\{([\s\S]*?)\n\}/g;
  for (const match of content.matchAll(pattern)) {
    if (members.has(match[1])) throw new Error(`${context}: duplicate member ${match[1]}`);
    members.set(match[1], { id: match[1], body: match[2] });
  }
  if (!members.size) throw new Error(`${context}: no workspace members found`);
  return members;
}

function requireExactIds(actual, expected, context) {
  const actualSorted = [...actual].sort();
  const expectedSorted = [...expected].sort();
  if (JSON.stringify(actualSorted) !== JSON.stringify(expectedSorted)) {
    throw new Error(
      `${context}: expected [${expectedSorted.join(", ")}], got [${actualSorted.join(", ")}]`,
    );
  }
}

function discoverProjectManifest(projectDir) {
  const entries = readdirSync(projectDir).filter((entry) => entry.endsWith(".bproj")).sort();
  if (entries.length !== 1) {
    throw new Error(`Expected exactly one .bproj in ${projectDir}, found ${entries.length}`);
  }
  return join(projectDir, entries[0]);
}

function validateProjectBlockIdentifier(content, manifest) {
  const match = content.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*\{/);
  if (!match) {
    throw new Error(`${manifest}: project block identifier must use Beskid identifier syntax`);
  }
}

function projectDependencyNames(content, context) {
  const names = [...content.matchAll(/dependency\s+"([^"]+)"\s*\{/g)].map((match) => match[1]);
  if (new Set(names).size !== names.length) {
    throw new Error(`${context}: duplicate dependency declaration`);
  }
  return names;
}

function resolveCorelibRoot() {
  const root = (process.env.BESKID_CORELIB_ROOT ?? process.env.CORELIB_ROOT ?? "/corelib").trim();
  if (!existsSync(join(root, "CoreLib.bws"))) throw new Error(`CoreLib.bws not found under ${root}`);
  return root;
}

function resolveTemplatesRoot() {
  const root = requireEnv("BESKID_TEMPLATES_ROOT");
  if (!existsSync(join(root, "beskid_templates.bws"))) {
    throw new Error(`beskid_templates.bws not found under ${root}`);
  }
  return root;
}

// Order packages so that every dependency is packed and uploaded before its dependents.
function dependencyOrder(packages) {
  const byName = new Map(packages.map((meta) => [meta.registryName, meta]));
  const ordered = [];
  const state = new Map();
  const visit = (meta, path) => {
    if (state.get(meta.registryName) === "done") return;
    if (state.get(meta.registryName) === "active") {
      throw new Error(`corelib dependency cycle: ${[...path, meta.registryName].join(" -> ")}`);
    }
    state.set(meta.registryName, "active");
    for (const dependency of meta.dependencyNames) {
      const target = byName.get(dependency);
      if (target) visit(target, [...path, meta.registryName]);
    }
    state.set(meta.registryName, "done");
    ordered.push(meta);
  };
  for (const meta of packages) visit(meta, []);
  return ordered;
}

export function corelibInventory(workspaceRoot) {
  const workspacePath = join(workspaceRoot, "CoreLib.bws");
  const workspaceText = readFileSync(workspacePath, "utf8");
  if (projectField(workspaceText, "name") !== "corelib") {
    throw new Error(`${workspacePath}: workspace.name must be corelib`);
  }
  const members = parseWorkspaceMembers(workspaceText, workspacePath);
  for (const memberId of EXCLUDED_CORELIB_MEMBERS.keys()) {
    if (!members.has(memberId)) {
      throw new Error(`${workspacePath}: excluded corelib member ${memberId} is not a workspace member`);
    }
  }
  if (!members.has("corelib")) throw new Error(`${workspacePath}: the corelib aggregate member is missing`);

  const packages = [...members.keys()].filter((memberId) => !EXCLUDED_CORELIB_MEMBERS.has(memberId)).map((memberId) => {
    const member = members.get(memberId);
    const sourceRel = projectField(member.body, "path");
    const registryName = projectField(member.body, "package");
    const description = projectField(member.body, "description");
    const category = projectField(member.body, "category");
    const tags = parseTags(projectField(member.body, "tags"), `${workspacePath}:${memberId}`);
    if (!sourceRel || !registryName || !description || category !== "Library") {
      throw new Error(`${workspacePath}:${memberId}: incomplete production package metadata (path, package, description and category = "Library" are required, or exclude the member)`);
    }
    const source = join(workspaceRoot, sourceRel);
    const manifest = discoverProjectManifest(source);
    const manifestText = readFileSync(manifest, "utf8");
    validateProjectBlockIdentifier(manifestText, manifest);
    if (projectField(manifestText, "name") !== registryName) {
      throw new Error(`${manifest}: project.name must be ${registryName}`);
    }
    // A readme is optional for the packer; a declared readme must exist.
    const readme = projectField(manifestText, "readme");
    if (readme && !existsSync(join(source, readme))) {
      throw new Error(`${manifest}: declared readme ${readme} is missing`);
    }
    return {
      kind: "library",
      projectType: projectField(manifestText, "type") ?? "Lib",
      // Every library ships its API reference (hasApiDocs). `beskid doc` places generated and
      // dependency units since 0.6.7, so no package is exempt.
      hasApiDocs: true,
      category,
      memberId,
      registryName,
      sourceRel,
      description,
      tags,
      repositoryUrl: `${CORELIB_REPOSITORY_BASE}/${sourceRel}`,
      dependencyNames: projectDependencyNames(manifestText, manifest),
    };
  });

  // The aggregate depends on exactly the published libraries: every published
  // member except itself and Mods, which are published as dependencies.
  const aggregate = packages.find((meta) => meta.memberId === "corelib");
  requireExactIds(
    aggregate.dependencyNames,
    packages.filter((meta) => meta !== aggregate && meta.projectType !== "Mod").map((meta) => meta.registryName),
    "production corelib aggregate dependencies",
  );
  const publishedNames = new Set(packages.map((meta) => meta.registryName));
  for (const meta of packages) {
    for (const dependency of meta.dependencyNames) {
      if (!publishedNames.has(dependency)) {
        throw new Error(`${meta.registryName}: dependency ${dependency} is not in the production publication plan`);
      }
    }
  }
  return dependencyOrder(packages);
}

function templateInventory(workspaceRoot) {
  const workspacePath = join(workspaceRoot, "beskid_templates.bws");
  const workspaceText = readFileSync(workspacePath, "utf8");
  if (projectField(workspaceText, "name") !== "beskid_templates") {
    throw new Error(`${workspacePath}: workspace.name must be beskid_templates`);
  }
  const members = parseWorkspaceMembers(workspaceText, workspacePath);
  requireExactIds(members.keys(), TEMPLATE_MEMBER_IDS, "classified template inventory");

  const metadataPath = join(workspaceRoot, "workspace.package.json");
  const metadata = JSON.parse(readFileSync(metadataPath, "utf8"));
  if (metadata.schema !== "beskid.workspace.package.v1" || !metadata.members) {
    throw new Error(`${metadataPath}: invalid workspace package metadata`);
  }
  requireExactIds(Object.keys(metadata.members), TEMPLATE_MEMBER_IDS, "template registry metadata");

  return TEMPLATE_MEMBER_IDS.map((memberId) => {
    const sourceRel = projectField(members.get(memberId).body, "path");
    const registry = metadata.members[memberId];
    if (!sourceRel || !registry || registry.category !== "Template") {
      throw new Error(`${metadataPath}:${memberId}: incomplete template package metadata`);
    }
    const source = join(workspaceRoot, sourceRel);
    const manifest = discoverProjectManifest(source);
    const manifestText = readFileSync(manifest, "utf8");
    validateProjectBlockIdentifier(manifestText, manifest);
    if (projectField(manifestText, "type") !== "Template") {
      throw new Error(`${manifest}: project.type must be Template`);
    }
    const projectIdentity = projectField(manifestText, "identity");
    const templatePath = join(source, ".beskid", "template.json");
    if (!existsSync(templatePath)) throw new Error(`${templatePath}: template manifest is missing`);
    const template = JSON.parse(readFileSync(templatePath, "utf8"));
    const templateIdentity = String(template.identity ?? "").split("::", 1)[0];
    if (
      projectIdentity !== registry.package ||
      templateIdentity !== registry.package ||
      projectField(manifestText, "shortName") !== template.shortName
    ) {
      throw new Error(`${source}: project, registry, and template identities must agree`);
    }
    return {
      kind: "template",
      category: "Template",
      memberId,
      registryName: registry.package,
      sourceRel,
      description: registry.description,
      tags: registry.tags,
      repositoryUrl: `${TEMPLATES_REPOSITORY_BASE}/${sourceRel}`,
      dependencyNames: projectDependencyNames(manifestText, manifest),
    };
  });
}

function copyWorkspace(source, destination) {
  cpSync(source, destination, {
    recursive: true,
    filter(path) {
      const name = basename(path);
      return ![".git", "target", "obj", "bin", "node_modules"].includes(name) &&
        name !== "pckg-version-state.json" &&
        !name.endsWith(".bpk");
    },
  });
}

function generateCorelibDocsForPackage(cliBin, workspaceRoot, meta) {
  const environment = { ...process.env, BESKID_CORELIB_ROOT: workspaceRoot };
  const source = join(workspaceRoot, meta.sourceRel);
  const docsOut = join(source, ".beskid", "docs");
  rmSync(docsOut, { recursive: true, force: true });
  if (!meta.hasApiDocs) {
    console.log(`[pack] ${meta.registryName}: declaration-only facade; API docs omitted`);
    return;
  }
  const manifest = discoverProjectManifest(source);
  execFileSync(cliBin, ["doc", "--project", manifest, "--out", docsOut], {
    cwd: workspaceRoot,
    env: environment,
    stdio: "inherit",
  });
  const apiJson = join(docsOut, "api.json");
  if (!existsSync(apiJson) || statSync(apiJson).size === 0) {
    throw new Error(`Doc generation did not produce ${apiJson}`);
  }
}

function removeBuildOutputs(root) {
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (!entry.isDirectory()) continue;
    if (["obj", "bin"].includes(entry.name)) {
      rmSync(path, { recursive: true, force: true });
    } else {
      removeBuildOutputs(path);
    }
  }
}

function parseSemver(raw, context) {
  const match = String(raw).trim().match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) throw new Error(`${context}: unsupported semantic version ${raw}`);
  return { raw: String(raw).trim(), major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]) };
}

function compareSemver(left, right) {
  return left.major - right.major || left.minor - right.minor || left.patch - right.patch;
}

// BESKID_PCKG_VERSION_BUMP: patch | minor | major | an exact MAJOR.MINOR.PATCH version.
export function parseVersionPolicy(raw) {
  const value = String(raw ?? "").trim().toLowerCase() || "patch";
  if (["patch", "minor", "major"].includes(value)) return value;
  if (/^\d+\.\d+\.\d+$/.test(value)) return parseSemver(value, "BESKID_PCKG_VERSION_BUMP").raw;
  throw new Error("BESKID_PCKG_VERSION_BUMP must be patch, minor, major, or an exact MAJOR.MINOR.PATCH version");
}

export function nextVersion(latest, bump) {
  const base = latest ? parseSemver(latest, "registry version") : parseSemver("0.1.0", "initial version");
  if (/^\d/.test(bump)) {
    const exact = parseSemver(bump, "BESKID_PCKG_VERSION_BUMP");
    if (latest && compareSemver(exact, base) <= 0) {
      throw new Error(`exact version ${exact.raw} is not greater than the latest registry version ${base.raw}`);
    }
    return exact.raw;
  }
  if (bump === "major") return `${base.major + 1}.0.0`;
  if (bump === "minor") return `${base.major}.${base.minor + 1}.0`;
  return `${base.major}.${base.minor}.${base.patch + 1}`;
}

function latestVersion(rows, packageName) {
  const parsed = rows.map((row) => parseSemver(row.version, `${packageName} registry response`));
  parsed.sort(compareSemver);
  return parsed.at(-1)?.raw ?? null;
}

function writePackBaseline(source, latest, dependencies) {
  const baseline = latest ?? "0.1.0";
  writeFileSync(join(source, "package.json"), JSON.stringify({ version: baseline, dependencies }, null, 2));
}

function normalizedDependencies(dependencies, context) {
  if (!Array.isArray(dependencies)) throw new Error(`${context}: dependencies must be an array`);
  return dependencies.map((dependency) => ({
    name: dependency.name,
    source: dependency.source,
    version: dependency.version,
  })).sort((left, right) => left.name.localeCompare(right.name));
}

function canonicalJson(value) {
  if (Array.isArray(value)) return value.map(canonicalJson);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalJson(value[key])]));
  }
  return value;
}

function validateArtifact(artifact, meta, expectedVersion) {
  const entries = execFileSync("unzip", ["-Z1", artifact], { encoding: "utf8" })
    .split("\n")
    .filter(Boolean);
  if (!entries.includes("package.json") || !entries.includes("checksums.sha256")) {
    throw new Error(`${artifact}: missing canonical package metadata`);
  }
  const manifest = JSON.parse(execFileSync("unzip", ["-p", artifact, "package.json"], { encoding: "utf8" }));
  if (manifest.id !== meta.registryName || manifest.version !== expectedVersion) {
    throw new Error(`${artifact}: packed identity/version does not match publication plan`);
  }
  const expectedDependencies = normalizedDependencies(meta.plannedDependencies ?? [], `${artifact} plan`);
  const actualDependencies = normalizedDependencies(manifest.dependencies ?? [], `${artifact} manifest`);
  if (JSON.stringify(actualDependencies) !== JSON.stringify(expectedDependencies)) {
    throw new Error(`${artifact}: packed dependencies do not match publication plan`);
  }
  const projectEntry = entries.find((entry) => !entry.includes("/") && entry.endsWith(".bproj"));
  if (projectEntry) {
    const project = execFileSync("unzip", ["-p", artifact, projectEntry], { encoding: "utf8" });
    if (/source\s*=\s*"?(path|git)"?/m.test(project) || /^\s*path\s*=/m.test(project)) {
      throw new Error(`${artifact}: installed artifact retains a non-registry dependency source`);
    }
    for (const dependency of expectedDependencies) {
      if (!project.includes(`dependency "${dependency.name}"`) || !project.includes(`version = "${dependency.version}"`)) {
        throw new Error(`${artifact}: project dependency ${dependency.name} is not pinned to the publication plan`);
      }
    }
  }
  if (meta.kind === "template") {
    if (manifest.packageKind !== "template" || !entries.includes("template.json")) {
      throw new Error(`${artifact}: template artifact profile is incomplete`);
    }
    if (entries.includes(".beskid/template.json") || entries.some((entry) => entry.startsWith(".beskid/docs/"))) {
      throw new Error(`${artifact}: template artifact contains authoring-only paths`);
    }
    const template = JSON.parse(execFileSync("unzip", ["-p", artifact, "template.json"], { encoding: "utf8" }));
    const identity = String(template.identity ?? "");
    if (template.schema !== "beskid.template.v1" || identity.split("::", 1)[0] !== meta.registryName) {
      throw new Error(`${artifact}: template schema and identity must match the package contract`);
    }
    const expectedSummary = Object.fromEntries(
      ["shortName", "identity", "tags"].filter((key) => key in template).map((key) => [key, template[key]]),
    );
    if (JSON.stringify(canonicalJson(manifest.template)) !== JSON.stringify(canonicalJson(expectedSummary))) {
      throw new Error(`${artifact}: template summary does not match template.json`);
    }
  } else if (meta.hasApiDocs && !entries.includes(".beskid/docs/api.json")) {
    throw new Error(`${artifact}: library artifact is missing .beskid/docs/api.json`);
  } else if (!meta.hasApiDocs && entries.includes(".beskid/docs/api.json")) {
    throw new Error(`${artifact}: declaration-only package unexpectedly advertises generated API docs`);
  }
}

function packArtifacts(cliBin, stage, corelibPackages, templatePackages, plans) {
  const artifactsDir = join(stage, "artifacts");
  const versionStateDir = join(stage, "version-state");
  mkdirSync(artifactsDir, { recursive: true });
  mkdirSync(versionStateDir, { recursive: true });
  const all = [
    ...corelibPackages.map((meta) => ({ ...meta, workspace: join(stage, "corelib") })),
    ...templatePackages.map((meta) => ({ ...meta, workspace: join(stage, "templates") })),
  ];
  const packed = [];
  for (const meta of all) {
    const plan = plans.get(meta.registryName);
    const source = join(meta.workspace, meta.sourceRel);
    if (plan.published) {
      console.log(`[resume] ${meta.registryName}@${plan.version} is already published; not packed`);
      continue;
    }
    if (meta.kind === "library") {
      generateCorelibDocsForPackage(cliBin, meta.workspace, meta);
    }
    const plannedDependencies = meta.dependencyNames.map((name) => {
      const dependencyPlan = plans.get(name);
      if (!dependencyPlan) throw new Error(`${meta.registryName}: no publication plan for dependency ${name}`);
      return { name, version: dependencyPlan.version, source: "registry" };
    }).sort((left, right) => left.name.localeCompare(right.name));
    writePackBaseline(source, plan.latest, plannedDependencies);
    const artifact = join(artifactsDir, `${meta.registryName}-${plan.version}.bpk`);
    const args = [
      "package", "pack",
      "--package", meta.registryName,
      "--source", source,
      "--output", artifact,
      "--version-state-file", join(versionStateDir, `${meta.registryName}.json`),
      "--skip-docs",
    ];
    args.push("--version", plan.version);
    execFileSync(cliBin, args, { cwd: meta.workspace, env: process.env, stdio: "inherit" });
    const plannedMeta = { ...meta, plannedDependencies };
    validateArtifact(artifact, plannedMeta, plan.version);
    packed.push({ ...plannedMeta, artifact, version: plan.version, existed: plan.existed });
    console.log(`[pack] ${meta.registryName}@${plan.version} (${meta.kind})`);
  }
  return packed;
}


function normalizedBaseUrl(raw) {
  const url = new URL(raw.endsWith("/") ? raw : `${raw}/`);
  const local = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  if (url.protocol !== "https:" && !(local && url.protocol === "http:")) {
    throw new Error("BESKID_PCKG_BASE_URL must use HTTPS (HTTP is allowed only for loopback tests)");
  }
  return url;
}

function requirePublisherToken() {
  const token = requireEnv("BESKID_PCKG_API_KEY");
  if (!/^bpk_[0-9a-fA-F]{64}$/.test(token)) {
    throw new Error("BESKID_PCKG_API_KEY must be a canonical bpk_ publisher token");
  }
  return token;
}

function authHeaders(token) {
  return { Accept: "application/json", Authorization: `Bearer ${token}` };
}

async function responseText(response) {
  const body = await response.text();
  return body.length > 2_000 ? `${body.slice(0, 2_000)}...` : body;
}

export async function assertRegistryReady(baseUrl) {
  // The public pckg origin proxies /api/* to the registry, not /health/*.
  // Exercise the same route that publication uses before any mutation.
  const response = await fetch(new URL("api/packages", baseUrl), { headers: { Accept: "application/json" } });
  const body = await response.text();
  if (!response.ok) throw new Error(`pckg readiness failed (HTTP ${response.status}): ${body.slice(0, 2_000)}`);
  if (!Array.isArray(JSON.parse(body))) throw new Error("pckg readiness returned an invalid package list");
}

// Check 1: tags are unique within each package. A duplicate is an authoring error in the
// workspace metadata; the publisher reports it and never rewrites the tag list.
export function assertUniqueTags(packages) {
  const problems = [];
  for (const meta of packages) {
    const seen = new Set();
    const duplicates = new Set();
    for (const tag of meta.tags) {
      const key = tag.trim().toLowerCase();
      if (seen.has(key)) duplicates.add(tag);
      seen.add(key);
    }
    if (duplicates.size) problems.push(`${meta.registryName}: duplicate tag ${[...duplicates].map((t) => `"${t}"`).join(", ")}`);
  }
  if (problems.length) throw new Error(`duplicate package tags:\n  ${problems.join("\n  ")}`);
}

// Check 2: ask the registry who the key belongs to. /api/auth/session answers for a bearer key.
export async function keySubject(baseUrl, token) {
  const response = await fetch(new URL("api/auth/session", baseUrl), { headers: authHeaders(token) });
  const body = await responseText(response);
  if (response.status === 401) throw new Error("the registry rejected the publisher key (HTTP 401)");
  if (!response.ok) {
    throw new Error(`the registry cannot name the owner of the key (HTTP ${response.status}); refusing to publish: ${body}`);
  }
  let subject;
  try {
    subject = JSON.parse(body).subject;
  } catch {
    throw new Error("the registry returned an unreadable key identity; refusing to publish");
  }
  if (typeof subject !== "string" || !subject.trim()) {
    throw new Error("the registry returned no subject for the key; refusing to publish");
  }
  return subject;
}

async function packageOwner(baseUrl, token, name) {
  const response = await fetch(new URL(`api/packages/${encodeURIComponent(name)}`, baseUrl), { headers: authHeaders(token) });
  if (response.status === 404) return null;
  const body = await responseText(response);
  if (!response.ok) throw new Error(`Cannot read package ${name} (HTTP ${response.status}): ${body}`);
  const owner = JSON.parse(body)?.package?.ownerUserId;
  if (typeof owner !== "string" || !owner) throw new Error(`${name}: the registry returned no package owner`);
  return owner;
}

async function registryVersions(baseUrl, token, name) {
  const response = await fetch(new URL(`api/packages/${encodeURIComponent(name)}/versions`, baseUrl), { headers: authHeaders(token) });
  if (response.status === 404) return null;
  const body = await responseText(response);
  if (!response.ok) throw new Error(`Cannot read ${name} versions (HTTP ${response.status}): ${body}`);
  const rows = JSON.parse(body);
  if (!Array.isArray(rows)) throw new Error(`${name}: versions response must be an array`);
  return latestVersion(rows, name);
}

// Decide the version of one package from the policy (or a pinned exact version) and the
// published latest. An exact version equal to the latest means: already published, skip.
export function planVersion(latest, policy) {
  if (/^\d/.test(policy)) {
    const exact = parseSemver(policy, "planned version");
    if (latest) {
      const order = compareSemver(exact, parseSemver(latest, "registry version"));
      if (order === 0) return { version: exact.raw, published: true };
      if (order < 0) throw new Error(`planned version ${exact.raw} is not newer than the published ${latest}`);
    }
    return { version: exact.raw, published: false };
  }
  return { version: nextVersion(latest, policy), published: false };
}

// Checks 2 and 3 against the registry: ownership and versions, with no write.
export async function planPublication({ baseUrl, token, packages, policy, pinned = new Map() }) {
  const subject = await keySubject(baseUrl, token);
  const plans = new Map();
  const problems = [];
  for (const meta of packages) {
    const owner = await packageOwner(baseUrl, token, meta.registryName);
    if (owner !== null && owner !== subject) {
      problems.push(`${meta.registryName}: owned by ${owner}, but the key belongs to ${subject}`);
      continue;
    }
    const latest = await registryVersions(baseUrl, token, meta.registryName);
    try {
      const plan = planVersion(latest, pinned.get(meta.registryName) ?? policy);
      plans.set(meta.registryName, { existed: owner !== null, latest, ...plan });
    } catch (error) {
      problems.push(`${meta.registryName}: ${error.message}`);
    }
  }
  if (problems.length) throw new Error(`publication checks failed:\n  ${problems.join("\n  ")}`);
  return { subject, plans };
}

function defaultIconUrl(baseUrl) {
  const override = (process.env.BESKID_CORELIB_ICON_URL ?? "").trim();
  return override || new URL("package-icons/corelib.svg", baseUrl).href;
}

async function createPackage(baseUrl, token, meta) {
  if (meta.existed) return;
  const response = await fetch(new URL("api/packages", baseUrl), {
    method: "POST",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({
      name: meta.registryName,
      description: meta.description,
      category: meta.category,
      repositoryUrl: meta.repositoryUrl,
      websiteUrl: "https://beskid-lang.org",
      tags: meta.tags,
      isPublic: true,
      submitForReview: false,
      reviewReason: null,
      iconUrl: defaultIconUrl(baseUrl),
    }),
  });
  const body = await responseText(response);
  if (response.status !== 201) {
    throw new Error(`Failed to create ${meta.registryName} metadata (HTTP ${response.status}): ${body}`);
  }
}

function publishArtifact(cliBin, baseUrl, token, meta) {
  execFileSync(
    cliBin,
    ["package", "publish", meta.registryName, "--artifact", meta.artifact],
    {
      env: {
        ...process.env,
        BESKID_PCKG_URL: baseUrl.href,
        BESKID_PCKG_API_KEY: token,
      },
      stdio: "inherit",
    },
  );
  console.log(`PCKG_PUBLISHED_VERSION=${meta.registryName}@${meta.version}`);
}

// The plan file pins relative-bump versions across an interrupted run, so a resume does not
// bump a second time. It records the policy it was made for and is removed on success.
function readPlanFile(path, policy) {
  if (!path || !existsSync(path)) return new Map();
  const saved = JSON.parse(readFileSync(path, "utf8"));
  if (saved.policy !== policy) {
    throw new Error(`${path} was written for version policy ${saved.policy}, not ${policy}; remove it to start a new run`);
  }
  return new Map(Object.entries(saved.versions));
}

function writePlanFile(path, policy, plans) {
  if (!path) return;
  mkdirSync(join(path, ".."), { recursive: true });
  writeFileSync(path, JSON.stringify({ policy, versions: Object.fromEntries([...plans].map(([name, plan]) => [name, plan.version])) }, null, 2));
}

async function main() {
  const dryRun = enabled("BESKID_PUBLISH_DRY_RUN");
  const bump = parseVersionPolicy(process.env.BESKID_PCKG_VERSION_BUMP);
  const rawToken = (process.env.BESKID_PCKG_API_KEY ?? "").trim();
  if (!dryRun || rawToken) requirePublisherToken();
  const token = rawToken || null;
  const baseUrl = token
    ? normalizedBaseUrl((process.env.BESKID_PCKG_BASE_URL ?? "https://pckg.beskid-lang.org").trim())
    : null;
  const planFile = (process.env.BESKID_PUBLISH_PLAN_FILE ?? "").trim();
  const cliBin = requireEnv("BESKID_CLI_BIN");
  const corelibRoot = resolveCorelibRoot();
  const templatesRoot = resolveTemplatesRoot();
  const corelibPackages = corelibInventory(corelibRoot);
  const templatePackages = templateInventory(templatesRoot);
  const allPackages = [...corelibPackages, ...templatePackages];
  assertUniqueTags(allPackages);
  process.stdout.write(runTemplateQualityGate(cliBin, templatesRoot, corelibRoot));

  let plans = new Map();
  if (token) {
    await assertRegistryReady(baseUrl);
    const planned = await planPublication({
      baseUrl,
      token,
      packages: allPackages,
      policy: bump,
      pinned: readPlanFile(planFile, bump),
    });
    plans = planned.plans;
    console.log(`[check] key belongs to ${planned.subject}; ownership, tags and versions ok`);
    if (!dryRun) writePlanFile(planFile, bump, plans);
  } else {
    for (const meta of allPackages) {
      plans.set(meta.registryName, { existed: false, latest: null, ...planVersion(null, bump) });
    }
  }
  for (const meta of allPackages) {
    const plan = plans.get(meta.registryName);
    console.log(`[plan] ${meta.registryName} ${plan.latest ?? "(new)"} -> ${plan.version}${plan.published ? " (already published)" : ""}`);
  }

  const stage = mkdtempSync(join(tmpdir(), "beskid-package-publish-"));
  try {
    copyWorkspace(corelibRoot, join(stage, "corelib"));
    copyWorkspace(templatesRoot, join(stage, "templates"));
    removeBuildOutputs(join(stage, "corelib"));
    // Every artifact packs and validates (API docs included) before the first write.
    const packed = packArtifacts(cliBin, stage, corelibPackages, templatePackages, plans);
    if (dryRun) {
      console.log(`CORELIB_PACKAGES_VALIDATED=${corelibPackages.map((meta) => meta.registryName).join(",")}`);
      console.log(`TEMPLATE_PACKAGES_VALIDATED=${templatePackages.map((meta) => meta.registryName).join(",")}`);
      console.log(`CORELIB_PUBLISH_DRY_RUN=ok (${packed.length} artifacts)`);
      return;
    }
    for (const meta of packed) await createPackage(baseUrl, token, meta);
    for (const meta of packed) publishArtifact(cliBin, baseUrl, token, meta);
    if (planFile) rmSync(planFile, { force: true });
    console.log(`Published ${packed.length} package(s) to ${baseUrl.href}`);
  } finally {
    if (!enabled("CI_KEEP_ARTIFACT")) rmSync(stage, { recursive: true, force: true });
    else console.log(`[pack] retained ${stage}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
