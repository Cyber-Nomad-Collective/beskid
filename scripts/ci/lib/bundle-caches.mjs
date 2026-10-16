// Build caches inside a release bundle: their removal at bundle assembly and the checks that none ship.
//
// The bundle assembly (build-release-artifact.sh) prebuilds each Corelib compiler Mod with
// `beskid dev mod rebuild` inside the bundle's Corelib workspace. That build leaves, beside the one
// artifact the installed toolchain needs, its own working state in the Mod project:
//
//   <mod>/obj/beskid/deps/src/...           materialized dependency sources (workspace preparation)
//   <mod>/obj/beskid/cache/salsa/...        Salsa query cache
//   <mod>/obj/beskid/.materialize-lock      materialization lock
//   <mod>/.beskid/obj/mods/<pkg>/.cache-lock  Mod cache publication lock
//
// None of it is read by an installed toolchain. Qualification of a shipped Mod
// (beskid_aot::qualify_cached_mod_artifact, beskid_analysis::mod_host::load) is strictly read-only:
// it reads only `<mod>/.beskid/obj/mods/<pkg>/<key>/<target>/` (whose complete file inventory is
// sealed by mod.descriptor.json), the Mod manifest, sources and Project.lock, and the declared
// dependency projects. Locks are taken only to build, and an installed prefix never builds.
//
// Kept: every sealed Mod entry `.beskid/obj/mods/<pkg>/<32-hex key>/<target>/` that holds
// mod.descriptor.json, byte for byte. Removed: every other `obj` or `.beskid` tree (including test
// project outputs such as `tests/<project>/obj`). The Corelib integrity seal excludes `obj`, `.beskid`
// and Project.lock, so removal leaves the bundle seal valid.
//
// build-release-artifact.sh prunes the assembled bundle before it is archived
// (`node bundle-caches.mjs prune <bundle-dir>`), woodpecker-build-platform.sh checks the archive listing
// (`node bundle-caches.mjs check <bundle-root-name> < listing`), and native packaging refuses a bundle
// that still carries a cache (OpenSpec v06-release-gate-calibration task 6.5).
import { lstatSync, readFileSync, readdirSync, realpathSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const CACHE_COMPONENTS = new Set(["obj", ".beskid"]);
const KEY = /^[0-9a-f]{32}$/;
const TARGET = /^[A-Za-z0-9_]+(-[A-Za-z0-9_.]+){2,3}$/;

// The bundle-relative prefix of the sealed Mod entry a path lies in, or null.
function SealedEntryPrefix(segments) {
  for (let index = 0; index + 5 < segments.length; index += 1) {
    if (segments[index] !== ".beskid" || segments[index + 1] !== "obj" || segments[index + 2] !== "mods") continue;
    const [pkg, key, target] = segments.slice(index + 3, index + 6);
    if (pkg && !pkg.startsWith(".") && KEY.test(key) && TARGET.test(target)) return index + 6;
  }
  return null;
}

// Bundle-relative file paths (`/` separators) that are build caches. A file inside a sealed Mod
// entry is never a cache, whatever its own path components are.
export function BundleCacheViolations(relativeFiles) {
  return relativeFiles.filter(path => {
    const segments = path.split("/").filter(Boolean);
    const sealed = SealedEntryPrefix(segments);
    const outside = sealed === null ? segments : segments.slice(0, sealed);
    if (sealed !== null) {
      // Only `.beskid/obj/mods/<pkg>/<key>/<target>` itself may carry cache-named components.
      const head = outside.slice(0, outside.length - 6);
      return head.some(segment => CACHE_COMPONENTS.has(segment));
    }
    return outside.some(segment => CACHE_COMPONENTS.has(segment));
  });
}

// Bundle-relative paths (`/` separators) of every non-directory entry below a bundle root.
export function BundleFiles(root, relative = "", out = []) {
  for (const entry of readdirSync(join(root, relative), { withFileTypes: true })) {
    const path = relative ? `${relative}/${entry.name}` : entry.name;
    if (entry.isDirectory()) BundleFiles(root, path, out);
    else out.push(path);
  }
  return out;
}

// Bundle-relative file paths of a `tar -t` listing of a bundle whose top-level directory is
// `bundleRoot`. Directory entries (trailing `/`) are skipped; an entry outside the root is kept whole so
// that a cache-named component in it is still reported.
export function ListingFiles(listing, bundleRoot) {
  const prefix = `${bundleRoot}/`;
  return listing.split(/\r?\n/).filter(line => line && !line.endsWith("/"))
    .map(line => line.replace(/^\.\//, ""))
    .map(line => line.startsWith(prefix) ? line.slice(prefix.length) : line);
}

// Fail closed when a bundle carries a build cache.
export function AssertNoBundleCaches(relativeFiles, label) {
  const caches = BundleCacheViolations(relativeFiles);
  if (caches.length) {
    throw new Error(`${label} carries ${caches.length} build-cache path(s), for example ${caches.slice(0, 10).join(", ")}`);
  }
}

function IsSealedEntry(directory) {
  try {
    return lstatSync(join(directory, "mod.descriptor.json")).isFile();
  } catch {
    return false;
  }
}

// Remove everything in a `.beskid` tree except sealed Mod entries. Returns removed relative paths.
function PruneDotBeskid(root, relative, removed) {
  const keep = new Set();
  const mods = `${relative}/obj/mods`;
  let packages = [];
  try {
    packages = readdirSync(join(root, mods), { withFileTypes: true });
  } catch {
    packages = [];
  }
  for (const pkg of packages) {
    if (!pkg.isDirectory() || pkg.name.startsWith(".")) continue;
    for (const key of readdirSync(join(root, mods, pkg.name), { withFileTypes: true })) {
      if (!key.isDirectory() || !KEY.test(key.name)) continue;
      for (const target of readdirSync(join(root, mods, pkg.name, key.name), { withFileTypes: true })) {
        const entry = `${mods}/${pkg.name}/${key.name}/${target.name}`;
        if (target.isDirectory() && TARGET.test(target.name) && IsSealedEntry(join(root, entry))) keep.add(entry);
      }
    }
  }
  const visit = directory => {
    let kept = false;
    for (const entry of readdirSync(join(root, directory), { withFileTypes: true })) {
      const path = `${directory}/${entry.name}`;
      if (keep.has(path)) { kept = true; continue; }
      if (entry.isDirectory() && [...keep].some(sealed => sealed.startsWith(`${path}/`))) {
        if (visit(path)) kept = true;
        continue;
      }
      rmSync(join(root, path), { recursive: true, force: true });
      removed.push(path);
    }
    return kept;
  };
  if (!visit(relative)) {
    rmSync(join(root, relative), { recursive: true, force: true });
    removed.push(relative);
  }
}

// Remove build caches from an extracted bundle and prove none remain. Returns the removed paths.
export function PruneBundleCaches(bundleRoot) {
  const removed = [];
  const visit = relative => {
    for (const entry of readdirSync(join(bundleRoot, relative), { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const path = relative ? `${relative}/${entry.name}` : entry.name;
      if (entry.name === "obj") {
        rmSync(join(bundleRoot, path), { recursive: true, force: true });
        removed.push(path);
      } else if (entry.name === ".beskid") {
        PruneDotBeskid(bundleRoot, path, removed);
      } else {
        visit(path);
      }
    }
  };
  visit("");
  const remaining = BundleCacheViolations(BundleFiles(bundleRoot));
  if (remaining.length) throw new Error(`bundle still contains build caches: ${remaining.slice(0, 10).join(", ")}`);
  return removed.sort();
}

function Main(argv) {
  const [command, operand, ...rest] = argv;
  if (command === "prune" && operand && !rest.length) {
    const removed = PruneBundleCaches(resolve(operand));
    process.stderr.write(`bundle assembly: removed ${removed.length} build-cache path(s)\n`);
    return;
  }
  if (command === "check" && operand && !rest.length) {
    AssertNoBundleCaches(ListingFiles(readFileSync(0, "utf8"), operand), "release bundle");
    return;
  }
  throw new Error("usage: bundle-caches.mjs prune <bundle-dir> | check <bundle-root-name> < tar-listing");
}

// Compare real paths: the script may be reached through a symlinked directory (macOS /var -> /private/var).
if (process.argv[1] && realpathSync(resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url))) {
  try {
    Main(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exit(1);
  }
}
