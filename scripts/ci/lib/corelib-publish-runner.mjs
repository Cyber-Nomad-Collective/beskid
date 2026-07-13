#!/usr/bin/env node
/**
 * Native corelib publish runner (port of compiler/corelib/ci/publish_corelib.py).
 * Invoked by scripts/ci/corelib-publish.sh after beskid_cli is built.
 */
import { randomUUID } from "node:crypto";
import { execSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { basename, join, relative, sep } from "node:path";

const REPOSITORY_BASE =
  "https://github.com/Cyber-Nomad-Collective/beskid_compiler/tree/main/compiler/corelib";

const SKIP_DIR_NAMES = new Set([
  "obj",
  "bin",
  ".git",
  ".ci-tools",
  ".ci-publish-pack",
  "__pycache__",
  ".pytest_cache",
  "node_modules",
]);
const SKIP_FILE_NAMES = new Set([".DS_Store"]);

const WORKSPACE_PACKAGES = [
  {
    registryName: "corelib",
    memberId: "corelib",
    sourceRel: "beskid_corelib",
    description:
      "Beskid standard library aggregate: path dependencies on foundation, runtime, console, concurrency, and compiler SDK packages.",
    tags: ["corelib", "stdlib", "beskid", "standard-library"],
  },
  {
    registryName: "corelib_foundation",
    memberId: "foundation",
    sourceRel: "packages/foundation",
    description:
      "Low-level primitives shared by Beskid corelib workspace packages (collections, results, strings, testing helpers).",
    tags: ["corelib", "foundation", "beskid", "stdlib"],
  },
  {
    registryName: "corelib_runtime",
    memberId: "runtime",
    sourceRel: "packages/runtime",
    description:
      "Runtime and syscall surfaces for Beskid (`System`, process, and I/O helpers).",
    tags: ["corelib", "runtime", "beskid", "stdlib", "syscall"],
  },
  {
    registryName: "corelib_compiler_sdk",
    memberId: "compiler_sdk",
    sourceRel: "packages/compiler-sdk",
    description:
      "Typed compiler Mod SDK facades (`Beskid.Compiler.*`, `Beskid.Syntax`) for `type: Mod` projects.",
    tags: ["corelib", "compiler", "mod-sdk", "beskid"],
  },
  {
    registryName: "corelib_console",
    memberId: "console",
    sourceRel: "packages/console",
    description:
      "Terminal and ANSI helpers (`Console`, `Ansi`) built on corelib runtime I/O.",
    tags: ["corelib", "console", "beskid", "stdlib"],
  },
  {
    registryName: "corelib_concurrency",
    memberId: "concurrency",
    sourceRel: "packages/concurrency",
    description:
      "Cooperative concurrency primitives (`Fiber`, channels) and `System.Threading` OS-thread helpers.",
    tags: ["corelib", "concurrency", "beskid", "stdlib"],
  },
];

const DOC_GENERATION_ORDER = [
  "packages/foundation",
  "packages/compiler-sdk",
  "packages/concurrency",
  "packages/runtime",
  "packages/console",
  "beskid_corelib",
];

function requireEnv(name) {
  const value = (process.env[name] ?? "").trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function projectField(content, key) {
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const eq = trimmed.indexOf("=");
    const currentKey = trimmed.slice(0, eq).trim();
    if (currentKey === key) {
      return trimmed
        .slice(eq + 1)
        .trim()
        .replace(/^"/, "")
        .replace(/"$/, "");
    }
  }
  return null;
}

function discoverProjectManifest(projectDir) {
  const entries = readdirSync(projectDir)
    .filter((e) => e.endsWith(".bproj"))
    .sort();
  if (entries.length !== 1) {
    throw new Error(
      `Expected exactly one .bproj in ${projectDir}, found ${entries.length}`,
    );
  }
  return join(projectDir, entries[0]);
}

function defaultIconUrl(baseUrl, packageName) {
  const override = (process.env.BESKID_CORELIB_ICON_URL ?? "").trim();
  if (override) return override;
  const root = baseUrl.replace(/\/$/, "") + "/";
  return new URL("package-icons/corelib.svg", root).href;
}

async function upsertPackage(baseUrl, apiKey, meta) {
  const url = new URL("api/packages", baseUrl.endsWith("/") ? baseUrl : baseUrl + "/");
  const payload = {
    name: meta.registryName,
    description: meta.description,
    category: "Library",
    repositoryUrl: `${REPOSITORY_BASE}/${meta.sourceRel}`,
    websiteUrl: "https://beskid-lang.org",
    tags: meta.tags,
    isPublic: true,
    submitForReview: false,
    reviewReason: null,
    iconUrl: defaultIconUrl(baseUrl, meta.registryName),
  };
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-API-Key": apiKey,
    },
    body: JSON.stringify(payload),
  });
  const body = await resp.text();
  if (!resp.ok) {
    throw new Error(
      `Failed to upsert ${meta.registryName} metadata (HTTP ${resp.status}): ${body}`,
    );
  }
  try {
    const parsed = JSON.parse(body);
    if (parsed.success === false) {
      throw new Error(`Upsert ${meta.registryName} failed: ${parsed.message ?? body}`);
    }
  } catch (e) {
    if (e instanceof SyntaxError) {
      console.log(`[publish] upsert ${meta.registryName}: non-JSON response`);
      return;
    }
    throw e;
  }
  console.log(`[publish] ensured ${meta.registryName} package metadata (upsert ok)`);
}

function resolveWorkspaceRoot() {
  const override = (process.env.BESKID_CORELIB_ROOT ?? "").trim();
  const root = override || process.env.CORELIB_ROOT || "/corelib";
  const manifest = discoverProjectManifest(join(root, "beskid_corelib"));
  if (!existsSync(manifest)) {
    throw new Error(`beskid_corelib manifest missing under ${root}`);
  }
  if (!existsSync(join(root, "CoreLib.bws"))) {
    throw new Error(`CoreLib.bws not found under ${root}`);
  }
  return root;
}

function validateWorkspacePackages(workspaceRoot) {
  const workspaceText = readFileSync(join(workspaceRoot, "CoreLib.bws"), "utf8");
  const workspaceName = projectField(workspaceText, "name");
  if (workspaceName !== "corelib") {
    throw new Error(`CoreLib.bws name must be 'corelib', got ${workspaceName}`);
  }
  for (const meta of WORKSPACE_PACKAGES) {
    const memberDir = join(workspaceRoot, meta.sourceRel);
    const manifest = discoverProjectManifest(memberDir);
    const projectName = projectField(readFileSync(manifest, "utf8"), "name");
    if (projectName !== meta.registryName) {
      throw new Error(
        `${manifest}: project.name must be ${meta.registryName}, got ${projectName}`,
      );
    }
    const readme =
      existsSync(join(memberDir, "README.md")) ||
      existsSync(join(memberDir, "readme.md"));
    if (!readme) {
      throw new Error(`Missing README for ${meta.registryName}`);
    }
  }
}

function pathLooksAbsolute(path) {
  if (!path?.trim()) return false;
  const trimmed = path.trim();
  if (trimmed.startsWith("/") || trimmed.startsWith("\\\\")) return true;
  if (trimmed.length >= 2 && trimmed[1] === ":") return true;
  return trimmed.replace(/\\/g, "/").includes("obj/beskid");
}

function validateApiJsonArtifactPaths(apiJson, packageName) {
  const data = JSON.parse(readFileSync(apiJson, "utf8"));
  const source = data.source || "";
  if (pathLooksAbsolute(source)) {
    throw new Error(
      `${apiJson}: source must be artifact-relative for ${packageName}, got ${source}`,
    );
  }
  for (const row of data.items || []) {
    const filePath = row.location?.file || "";
    if (filePath && pathLooksAbsolute(filePath)) {
      throw new Error(
        `${apiJson}: location.file for ${row.qualifiedName ?? "?"} must be artifact-relative, got ${filePath}`,
      );
    }
  }
}

function validateApiJsonLibraryTree(apiJson, packageName) {
  const data = JSON.parse(readFileSync(apiJson, "utf8"));
  const items = data.items || [];
  if (!items.length) {
    throw new Error(`${apiJson}: api.json has no items`);
  }
  if (data.navigationModel !== "graph-v1") {
    throw new Error(
      `${apiJson}: navigationModel must be graph-v1 (got ${data.navigationModel})`,
    );
  }
  const roots = items.filter(
    (row) => row.parentId === null || row.parentId === 0,
  ).length;
  if (roots > 128) {
    throw new Error(
      `${apiJson}: api.json has ${roots} graph roots (max 128 for ${packageName})`,
    );
  }
  for (const row of items) {
    const path = row.modulePath || [];
    if (
      row.kind === "module" &&
      path.length > 1 &&
      (row.parentId === null || row.parentId === 0)
    ) {
      throw new Error(
        `${apiJson}: nested module ${row.qualifiedName ?? "?"} must have parentId`,
      );
    }
  }
}

function generateMemberDocs(cliBin, workspaceRoot) {
  const packEnv = { ...process.env, BESKID_CORELIB_ROOT: workspaceRoot };
  for (const sourceRel of DOC_GENERATION_ORDER) {
    const meta = WORKSPACE_PACKAGES.find((m) => m.sourceRel === sourceRel);
    const source = join(workspaceRoot, sourceRel);
    const project = discoverProjectManifest(source);
    const docsOut = join(source, ".beskid", "docs");
    if (existsSync(docsOut)) rmSync(docsOut, { recursive: true, force: true });
    execSync(
      `"${cliBin}" doc --project "${project}" --out "${docsOut}"`,
      { cwd: workspaceRoot, env: packEnv, stdio: "inherit" },
    );
    const apiJson = join(docsOut, "api.json");
    if (!existsSync(apiJson)) {
      throw new Error(`Doc generation did not produce ${apiJson} for ${meta.registryName}`);
    }
    console.log(`[publish] wrote ${apiJson} (${statSync(apiJson).size} bytes)`);
    validateApiJsonLibraryTree(apiJson, meta.registryName);
    validateApiJsonArtifactPaths(apiJson, meta.registryName);
  }
}

function shouldSkipRelative(relPosix) {
  const parts = relPosix.split("/");
  const name = parts[parts.length - 1];
  if (SKIP_FILE_NAMES.has(name)) return true;
  if (parts.some((p) => SKIP_DIR_NAMES.has(p))) return true;
  if (relPosix.endsWith(".bpk")) return true;
  const beskidIdx = parts.indexOf(".beskid");
  if (beskidIdx >= 0) {
    const after = parts.slice(beskidIdx + 1);
    if (!after.length || after[0] !== "docs") return true;
  }
  return false;
}

function buildWorkspaceBundle(workspaceRoot, output) {
  if (existsSync(output)) rmSync(output);
  execSync(`command -v zip >/dev/null`, { stdio: "inherit", shell: true });
  const staging = join(workspaceRoot, ".ci-publish-pack");
  if (existsSync(staging)) rmSync(staging, { recursive: true, force: true });
  execSync(`mkdir -p "${staging}"`, { shell: true });
  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      const rel = relative(workspaceRoot, full).split(sep).join("/");
      if (entry.isDirectory()) {
        if (!shouldSkipRelative(rel + "/")) walk(full);
      } else if (entry.isFile() && !shouldSkipRelative(rel)) {
        const dest = join(staging, rel);
        execSync(`mkdir -p "${join(dest, "..")}"`, { shell: true });
        execSync(`cp "${full}" "${dest}"`, { shell: true });
      }
    }
  }
  walk(workspaceRoot);
  execSync(`cd "${staging}" && zip -r "${output}" .`, { shell: true });
  console.log(`[publish] workspace bundle: ${output} (${statSync(output).size} bytes)`);
  rmSync(staging, { recursive: true, force: true });
}

function encodeMultipart(fields, files) {
  const boundary = `beskid-${randomUUID().replace(/-/g, "")}`;
  const chunks = [];
  for (const [name, value] of Object.entries(fields)) {
    chunks.push(
      `--${boundary}\r\n`,
      `Content-Disposition: form-data; name="${name}"\r\n\r\n`,
      value,
      "\r\n",
    );
  }
  for (const [name, [filename, content, contentType]] of Object.entries(files)) {
    chunks.push(
      `--${boundary}\r\n`,
      `Content-Disposition: form-data; name="${name}"; filename="${filename}"\r\n`,
      `Content-Type: ${contentType}\r\n\r\n`,
    );
    chunks.push(content);
    chunks.push("\r\n");
  }
  chunks.push(`--${boundary}--\r\n`);
  const body = Buffer.concat(
    chunks.map((c) => (typeof c === "string" ? Buffer.from(c) : c)),
  );
  return { body, contentType: `multipart/form-data; boundary=${boundary}` };
}

async function publishWorkspaceBundle(baseUrl, apiKey, bundlePath, versionBump) {
  const url = new URL(
    "api/workspaces/publish",
    baseUrl.endsWith("/") ? baseUrl : baseUrl + "/",
  );
  const bundleBytes = readFileSync(bundlePath);
  const { body, contentType } = encodeMultipart(
    { versionBump },
    {
      artifact: [
        "workspace.bundle.zip",
        bundleBytes,
        "application/zip",
      ],
    },
  );
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(body.length),
      Accept: "application/json",
      "X-API-Key": apiKey,
    },
    body,
  });
  const responseBody = await resp.text();
  if (!resp.ok) {
    throw new Error(
      `Workspace publish failed (HTTP ${resp.status}): ${responseBody}`,
    );
  }
  const parsed = JSON.parse(responseBody);
  if (!parsed.success) {
    throw new Error(`Workspace publish failed: ${parsed.message ?? responseBody}`);
  }
  const packages = parsed.packages;
  if (!Array.isArray(packages) || !packages.length) {
    throw new Error(
      `Workspace publish succeeded but returned no packages: ${responseBody}`,
    );
  }
  return packages;
}

async function main() {
  const apiKey = requireEnv("BESKID_PCKG_API_KEY");
  const baseUrl = (process.env.BESKID_PCKG_BASE_URL ?? "https://pckg.beskid-lang.org").trim();
  const versionBump = (process.env.BESKID_PCKG_VERSION_BUMP ?? "patch").trim().toLowerCase();
  if (!["patch", "minor", "major"].includes(versionBump)) {
    throw new Error("BESKID_PCKG_VERSION_BUMP must be patch, minor, or major");
  }
  const cliBin = requireEnv("BESKID_CLI_BIN");
  const workspaceRoot = resolveWorkspaceRoot();
  validateWorkspacePackages(workspaceRoot);
  for (const meta of WORKSPACE_PACKAGES) {
    await upsertPackage(baseUrl, apiKey, meta);
  }
  generateMemberDocs(cliBin, workspaceRoot);
  const bundlePath = join(workspaceRoot, ".ci-publish-workspace.bundle.zip");
  buildWorkspaceBundle(workspaceRoot, bundlePath);
  const published = await publishWorkspaceBundle(baseUrl, apiKey, bundlePath, versionBump);
  for (const entry of published) {
    if (!entry || typeof entry !== "object") continue;
    const packageName = entry.packageName ?? "?";
    const version = entry.version ?? "?";
    const memberId = entry.memberId ?? "?";
    console.log(`PCKG_PUBLISHED_VERSION=${packageName}@${version}`);
    console.log(`[publish] ${memberId} -> ${packageName} ${version} (registry-assigned)`);
  }
  console.log(`Published ${published.length} workspace package(s) to ${baseUrl}`);
  const keepArtifact = ["1", "true", "yes"].includes(
    (process.env.CI_KEEP_ARTIFACT ?? "").trim().toLowerCase(),
  );
  if (!keepArtifact && existsSync(bundlePath)) {
    rmSync(bundlePath);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
