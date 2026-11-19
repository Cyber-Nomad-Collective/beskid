// Pre-write checks of scripts/release/lib/corelib-publish-runner.mjs against a fake registry.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import test from "node:test";
import { assertUniqueTags, planPublication, planVersion } from "../../release/lib/corelib-publish-runner.mjs";

const TOKEN = `bpk_${"a".repeat(64)}`;

// A fake registry: `packages` maps a name to { owner, versions }. `session` is the subject the
// key resolves to (null: the endpoint is missing). It records every request.
async function registry(t, { session = "owner-a", packages = {} } = {}) {
  const requests = [];
  const server = createServer((req, res) => {
    requests.push(`${req.method} ${req.url}`);
    const json = (status, body) => { res.writeHead(status, { "content-type": "application/json" }); res.end(JSON.stringify(body)); };
    if (req.headers.authorization !== `Bearer ${TOKEN}`) return json(401, {});
    if (req.url === "/api/auth/session") return session ? json(200, { subject: session }) : json(404, {});
    const match = req.url.match(/^\/api\/packages\/([^/]+)(\/versions)?$/);
    const entry = match && packages[decodeURIComponent(match[1])];
    if (!entry) return json(404, {});
    if (match[2]) return json(200, entry.versions.map((version) => ({ version })));
    return json(200, { package: { ownerUserId: entry.owner }, versions: [] });
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => server.close());
  return { baseUrl: new URL(`http://127.0.0.1:${server.address().port}/`), requests };
}
const pkg = (registryName, tags = ["corelib"]) => ({ registryName, tags });

test("duplicate tags within a package are rejected, never rewritten", () => {
  assert.throws(() => assertUniqueTags([pkg("corelib_connect", ["network", "tcp", "network"])]), /corelib_connect: duplicate tag "network"/);
  assert.throws(() => assertUniqueTags([pkg("a", ["Net", "net"])]), /duplicate tag/);
  assert.doesNotThrow(() => assertUniqueTags([pkg("a", ["net"]), pkg("b", ["net"])]));
});

test("the key subject must own every existing package", async (t) => {
  const { baseUrl } = await registry(t, { packages: { a: { owner: "owner-a", versions: ["0.6.6"] }, b: { owner: "someone-else", versions: ["0.6.6"] } } });
  await assert.rejects(
    planPublication({ baseUrl, token: TOKEN, packages: [pkg("a"), pkg("b")], policy: "patch" }),
    /b: owned by someone-else, but the key belongs to owner-a/,
  );
});

test("a registry that cannot name the key owner fails closed", async (t) => {
  const { baseUrl, requests } = await registry(t, { session: null, packages: { a: { owner: "owner-a", versions: ["0.6.6"] } } });
  await assert.rejects(planPublication({ baseUrl, token: TOKEN, packages: [pkg("a")], policy: "patch" }), /cannot name the owner of the key/);
  assert.deepEqual(requests, ["GET /api/auth/session"], "no package is read, and nothing is written");
});

test("a wrong key is rejected", async (t) => {
  const { baseUrl } = await registry(t);
  await assert.rejects(planPublication({ baseUrl, token: `bpk_${"b".repeat(64)}`, packages: [pkg("a")], policy: "patch" }), /rejected the publisher key/);
});

test("versions must be newer than the published one; the relative policy bumps", async (t) => {
  const { baseUrl } = await registry(t, { packages: { a: { owner: "owner-a", versions: ["0.6.6", "0.6.5"] }, c: { owner: "owner-a", versions: ["0.7.0"] } } });
  const { plans } = await planPublication({ baseUrl, token: TOKEN, packages: [pkg("a"), pkg("new")], policy: "patch" });
  assert.equal(plans.get("a").version, "0.6.7");
  assert.equal(plans.get("a").published, false);
  assert.equal(plans.get("a").existed, true);
  assert.equal(plans.get("new").version, "0.1.1", "a package the registry does not know is new");
  assert.equal(plans.get("new").existed, false);
  await assert.rejects(planPublication({ baseUrl, token: TOKEN, packages: [pkg("c")], policy: "0.6.7" }), /c: planned version 0.6.7 is not newer than the published 0.7.0/);
});

test("resume skips what is already published at the exact version and plans the rest", async (t) => {
  const { baseUrl } = await registry(t, { packages: { done: { owner: "owner-a", versions: ["0.6.6", "0.6.7"] }, todo: { owner: "owner-a", versions: ["0.6.6"] } } });
  const { plans } = await planPublication({ baseUrl, token: TOKEN, packages: [pkg("done"), pkg("todo")], policy: "0.6.7" });
  assert.equal(plans.get("done").published, true);
  assert.equal(plans.get("todo").published, false);
  assert.equal(plans.get("todo").version, "0.6.7");
});

test("a pinned plan survives a relative policy on resume", async (t) => {
  const { baseUrl } = await registry(t, { packages: { done: { owner: "owner-a", versions: ["0.6.7"] } } });
  const { plans } = await planPublication({ baseUrl, token: TOKEN, packages: [pkg("done")], policy: "patch", pinned: new Map([["done", "0.6.7"]]) });
  assert.equal(plans.get("done").published, true, "no second bump");
});

test("planVersion treats an equal exact version as published and an older one as an error", () => {
  assert.deepEqual(planVersion("0.6.6", "0.6.6"), { version: "0.6.6", published: true });
  assert.throws(() => planVersion("0.6.6", "0.6.5"), /not newer/);
  assert.deepEqual(planVersion(null, "0.6.7"), { version: "0.6.7", published: false });
});
