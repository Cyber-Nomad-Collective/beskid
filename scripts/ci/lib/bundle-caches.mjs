// Build caches inside an extracted release bundle, and their removal before native packaging.
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
// Kept: every sealed Mod entry `.beskid/obj/mods/<pkg>/<64-hex key>/<target>/` that holds
// mod.descriptor.json, byte for byte. Removed: every other `obj` or `.beskid` tree (including test
// project outputs such as `tests/<project>/obj`). The Corelib integrity seal excludes `obj`, `.beskid`
// and Project.lock, so removal leaves the bundle seal valid.
import { lstatSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const CACHE_COMPONENTS = new Set(["obj", ".beskid"]);
const KEY = /^[0-9a-f]{64}$/;
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

function Files(root, relative = "", out = []) {
  for (const entry of readdirSync(join(root, relative), { withFileTypes: true })) {
    const path = relative ? `${relative}/${entry.name}` : entry.name;
    if (entry.isDirectory()) Files(root, path, out);
    else out.push(path);
  }
  return out;
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
  const remaining = BundleCacheViolations(Files(bundleRoot));
  if (remaining.length) throw new Error(`bundle still contains build caches: ${remaining.slice(0, 10).join(", ")}`);
  return removed.sort();
}
