#!/usr/bin/env node
/**
 * Pack and publish the production corelib closure plus first-party templates.
 *
 * Every artifact is built and validated before the first registry mutation.
 * Set BESKID_PUBLISH_DRY_RUN=1 to exercise the complete local pack path without
 * a publisher key or any network access.
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
import { tmpdir } from "node:os";

const CORELIB_REPOSITORY_BASE =
  "https://github.com/Cyber-Nomad-Collective/beskid_compiler/tree/main/corelib";
const TEMPLATES_REPOSITORY_BASE =
  "https://github.com/Cyber-Nomad-Collective/beskid_templates/tree/main";

const PUBLISHED_CORELIB_MEMBERS = [
  "foundation",
  "compiler_sdk",
  "concurrency",
  "runtime",
  "console",
  "interop",
  "glue",
  "corelib",
];
const EXCLUDED_CORELIB_MEMBERS = new Set([
  "pest_gen_schema",
  "corelib_pest_gen",
  "corelib_tests",
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

function corelibInventory(workspaceRoot) {
  const workspacePath = join(workspaceRoot, "CoreLib.bws");
  const workspaceText = readFileSync(workspacePath, "utf8");
  if (projectField(workspaceText, "name") !== "corelib") {
    throw new Error(`${workspacePath}: workspace.name must be corelib`);
  }
  const members = parseWorkspaceMembers(workspaceText, workspacePath);
  requireExactIds(
    members.keys(),
    [...PUBLISHED_CORELIB_MEMBERS, ...EXCLUDED_CORELIB_MEMBERS],
    "classified corelib inventory",
  );

  const packages = PUBLISHED_CORELIB_MEMBERS.map((memberId) => {
    const member = members.get(memberId);
    const sourceRel = projectField(member.body, "path");
    const registryName = projectField(member.body, "package");
    const description = projectField(member.body, "description");
    const category = projectField(member.body, "category");
    const tags = parseTags(projectField(member.body, "tags"), `${workspacePath}:${memberId}`);
    if (!sourceRel || !registryName || !description || category !== "Library") {
      throw new Error(`${workspacePath}:${memberId}: incomplete production package metadata`);
    }
    const source = join(workspaceRoot, sourceRel);
    const manifest = discoverProjectManifest(source);
    const manifestText = readFileSync(manifest, "utf8");
    validateProjectBlockIdentifier(manifestText, manifest);
    if (projectField(manifestText, "name") !== registryName) {
      throw new Error(`${manifest}: project.name must be ${registryName}`);
    }
    const readme = projectField(manifestText, "readme");
    if (!readme || !existsSync(join(source, readme))) {
      throw new Error(`${manifest}: declared readme is missing`);
    }
    return {
      kind: "library",
      // Facade-only and aggregate/dependency-heavy packages are packable, but
      // the source doc command cannot yet normalize every non-root source path.
      hasApiDocs: ["foundation", "concurrency", "runtime"].includes(memberId),
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

  const aggregate = packages.find((meta) => meta.memberId === "corelib");
  requireExactIds(
    aggregate.dependencyNames,
    packages.filter((meta) => meta.memberId !== "corelib").map((meta) => meta.registryName),
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
  return packages;
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

function generateCorelibDocs(cliBin, workspaceRoot, packages) {
  const environment = { ...process.env, BESKID_CORELIB_ROOT: workspaceRoot };
  for (const meta of packages) {
    const source = join(workspaceRoot, meta.sourceRel);
    const docsOut = join(source, ".beskid", "docs");
    rmSync(docsOut, { recursive: true, force: true });
    if (!meta.hasApiDocs) {
      console.log(`[pack] ${meta.registryName}: declaration-only facade; API docs omitted`);
      continue;
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

function nextVersion(latest, bump) {
  const base = latest ? parseSemver(latest, "registry version") : parseSemver("0.1.0", "initial version");
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

function packArtifacts(cliBin, stage, corelibPackages, templatePackages, plans, bump) {
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
    const plannedDependencies = meta.dependencyNames.map((name) => {
      const dependencyPlan = plans.get(name);
      if (!dependencyPlan) throw new Error(`${meta.registryName}: no publication plan for dependency ${name}`);
      return { name, version: dependencyPlan.version, source: "registry" };
    }).sort((left, right) => left.name.localeCompare(right.name));
    writePackBaseline(source, plan.latest, plannedDependencies);
    const artifact = join(artifactsDir, `${meta.registryName}-${plan.version}.bpk`);
    const args = [
      "pckg", "pack",
      "--package", meta.registryName,
      "--source", source,
      "--output", artifact,
      "--version-state-file", join(versionStateDir, `${meta.registryName}.json`),
      "--skip-docs",
    ];
    if (bump !== "patch") args.push("--version", plan.version);
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
  return body.length > 2_000 ? `${body.slice(0, 2_000)}…` : body;
}

async function assertRegistryReady(baseUrl) {
  const response = await fetch(new URL("health/ready", baseUrl), { headers: { Accept: "application/json" } });
  const body = await responseText(response);
  if (!response.ok) throw new Error(`pckg readiness failed (HTTP ${response.status}): ${body}`);
  const parsed = JSON.parse(body);
  if (parsed.status !== "ok") throw new Error(`pckg readiness returned unexpected payload: ${body}`);
}

async function existingPackagePlan(baseUrl, token, meta, bump) {
  const response = await fetch(
    new URL(`api/packages/${encodeURIComponent(meta.registryName)}/versions`, baseUrl),
    { headers: authHeaders(token) },
  );
  if (response.status === 404) {
    return { existed: false, latest: null, version: nextVersion(null, bump) };
  }
  const body = await responseText(response);
  if (!response.ok) {
    throw new Error(`Cannot read ${meta.registryName} versions (HTTP ${response.status}): ${body}`);
  }
  const rows = JSON.parse(body);
  if (!Array.isArray(rows)) throw new Error(`${meta.registryName}: versions response must be an array`);
  const latest = latestVersion(rows, meta.registryName);
  return { existed: true, latest, version: nextVersion(latest, bump) };
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
    ["pckg", "upload", meta.registryName, "--artifact", meta.artifact],
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

async function main() {
  const dryRun = enabled("BESKID_PUBLISH_DRY_RUN");
  const bump = (process.env.BESKID_PCKG_VERSION_BUMP ?? "patch").trim().toLowerCase();
  if (!["patch", "minor", "major"].includes(bump)) {
    throw new Error("BESKID_PCKG_VERSION_BUMP must be patch, minor, or major");
  }
  const token = dryRun ? null : requirePublisherToken();
  const baseUrl = dryRun
    ? null
    : normalizedBaseUrl((process.env.BESKID_PCKG_BASE_URL ?? "https://pckg.beskid-lang.org").trim());
  const cliBin = requireEnv("BESKID_CLI_BIN");
  const corelibRoot = resolveCorelibRoot();
  const templatesRoot = resolveTemplatesRoot();
  const corelibPackages = corelibInventory(corelibRoot);
  const templatePackages = templateInventory(templatesRoot);
  const allPackages = [...corelibPackages, ...templatePackages];

  const plans = new Map();
  if (dryRun) {
    for (const meta of allPackages) {
      plans.set(meta.registryName, { existed: false, latest: null, version: nextVersion(null, bump) });
    }
  } else {
    await assertRegistryReady(baseUrl);
    for (const meta of allPackages) {
      plans.set(meta.registryName, await existingPackagePlan(baseUrl, token, meta, bump));
    }
  }

  const stage = mkdtempSync(join(tmpdir(), "beskid-package-publish-"));
  try {
    copyWorkspace(corelibRoot, join(stage, "corelib"));
    copyWorkspace(templatesRoot, join(stage, "templates"));
    generateCorelibDocs(cliBin, join(stage, "corelib"), corelibPackages);
    removeBuildOutputs(join(stage, "corelib"));
    const packed = packArtifacts(cliBin, stage, corelibPackages, templatePackages, plans, bump);
    if (dryRun) {
      console.log(`CORELIB_PACKAGES_VALIDATED=${corelibPackages.map((meta) => meta.registryName).join(",")}`);
      console.log(`TEMPLATE_PACKAGES_VALIDATED=${templatePackages.map((meta) => meta.registryName).join(",")}`);
      console.log(`CORELIB_PUBLISH_DRY_RUN=ok (${packed.length} artifacts)`);
      return;
    }
    for (const meta of packed) await createPackage(baseUrl, token, meta);
    for (const meta of packed) publishArtifact(cliBin, baseUrl, token, meta);
    console.log(`Published ${packed.length} package(s) to ${baseUrl.href}`);
  } finally {
    if (!enabled("CI_KEEP_ARTIFACT")) rmSync(stage, { recursive: true, force: true });
    else console.log(`[pack] retained ${stage}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
