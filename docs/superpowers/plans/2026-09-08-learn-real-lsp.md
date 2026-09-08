# Learn Real LSP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Learn's fake Monaco completions with compiler-authoritative Beskid LSP features for authenticated editor sessions.

**Architecture:** The Bun server owns a one-child-per-WebSocket JSON-RPC proxy to the bundled `beskid_lsp` process. A shared browser client maps the standard LSP surface into Monaco and is used by both Playground and lesson workspace editors.

**Tech Stack:** Bun WebSocket server, `beskid_lsp`/tower-lsp JSON-RPC over stdio, TypeScript, Monaco, Vitest, Docker.

**Spec:** `docs/superpowers/specs/2026-09-08-learn-real-lsp-design.md`

## Global Constraints

- `/api/lsp` accepts authenticated Learn sessions only; missing or invalid sessions return HTTP 401 before upgrade.
- `beskid_lsp` is the sole language-facts implementation; Learn cannot ship static completion content.
- Each LSP socket has an isolated temporary workspace and child process; both are removed on closure or failure.
- `/api/check` remains the explicit Run/analyze path.
- Rust binaries must run in the glibc-compatible Learn image.

---

### Task 1: Server-side LSP process bridge

**Files:**
- Create: `site/learn/src/server/lspBridge.ts`
- Create: `site/learn/src/server/lspBridge.test.ts`
- Modify: `site/learn/server.ts`

**Interfaces:**
- Produces: `createLspBridge(options): LspBridge` with `upgrade(request, server): Response | undefined` and `shutdown(): Promise<void>`.
- Consumes: `getLearnSession(request): Promise<LearnSession | null>`, `BESKID_LSP_BINARY`, Bun WebSocket callbacks.

- [ ] **Step 1: Write the failing bridge tests**

```ts
it("rejects an unauthenticated upgrade before starting a language server", async () => {
  const result = await bridge.upgrade(requestWithoutSession, server);
  expect(result?.status).toBe(401);
  expect(spawn).not.toHaveBeenCalled();
});

it("forwards framed JSON-RPC in both directions and removes its workspace on close", async () => {
  const socket = await bridge.connect(authenticatedRequest);
  socket.send('{"jsonrpc":"2.0","method":"initialize","id":1}');
  expect(child.stdin.write).toHaveBeenCalledWith(expect.stringContaining("Content-Length:"));
  child.stdout.emit("data", framedResponse);
  expect(socket.messages).toContain('{"jsonrpc":"2.0","id":1,"result":{}}');
  await socket.close();
  expect(removeWorkspace).toHaveBeenCalled();
});
```

- [ ] **Step 2: Run the bridge tests and verify RED**

Run: `pnpm --dir site/learn test -- lspBridge.test.ts`

Expected: FAIL because `lspBridge.ts` does not exist.

- [ ] **Step 3: Implement minimal framed bridge**

```ts
export function createLspBridge(options: LspBridgeOptions): LspBridge {
  return {
    async upgrade(request, server) {
      if (!(await options.getSession(request))) return jsonResponse(401, { error: "Authentication required" });
      const session = await createSession(options);
      return server.upgrade(request, { data: session }) ? undefined : jsonResponse(503, { error: "Language service unavailable" });
    },
    async shutdown() { await Promise.all([...sessions].map(closeSession)); },
  };
}
```

Implement LSP `Content-Length` framing with a buffer, maximum 1 MiB message size, child `error`/`exit` cleanup, and `SIGTERM` followed by `SIGKILL` only after a short grace period.

- [ ] **Step 4: Run bridge tests and typecheck**

Run: `pnpm --dir site/learn test -- lspBridge.test.ts && pnpm --dir site/learn typecheck`

Expected: PASS.

- [ ] **Step 5: Wire the bridge into Bun.serve**

```ts
const lspBridge = createLspBridge({ getSession: getLearnSession, binary: BESKID_LSP_BINARY });
Bun.serve({
  fetch(request, server) {
    if (new URL(request.url).pathname === "/api/lsp") return lspBridge.upgrade(request, server);
    // existing routes
  },
  websocket: lspBridge.websocket,
});
```

- [ ] **Step 6: Commit**

```bash
git add site/learn/server.ts site/learn/src/server/lspBridge.ts site/learn/src/server/lspBridge.test.ts
git commit -m "feat(learn): proxy authenticated LSP sessions"
```

### Task 2: Shared Monaco LSP client

**Files:**
- Create: `site/learn/src/lib/beskidLspClient.ts`
- Create: `site/learn/src/lib/beskidLspClient.test.ts`
- Modify: `site/learn/src/lib/playground.ts`
- Modify: `site/learn/src/components/Playground.tsx`
- Modify: `site/learn/src/components/lessonWorkspace/LessonWorkspace.tsx`

**Interfaces:**
- Produces: `attachBeskidLsp(editor, monaco, uri): Disposable`.
- Consumes: a Monaco `ITextModel`, same-origin `/api/lsp`, LSP `publishDiagnostics` and request methods.

- [ ] **Step 1: Write failing client tests**

```ts
it("maps a compiler completion response into Monaco suggestions", async () => {
  const client = connectLsp(fakeSocket, monaco, model);
  fakeSocket.receive(response(1, [{ label: "WriteLine", kind: 2 }]));
  await expect(client.completion(position)).resolves.toEqual(expect.objectContaining({ suggestions: [expect.objectContaining({ label: "WriteLine" })] }));
});

it("maps zero-based LSP diagnostics to one-based Monaco markers", () => {
  client.receive(publishDiagnostics(0, 2, 0, 7, "expected expression"));
  expect(monaco.editor.setModelMarkers).toHaveBeenCalledWith(model, "beskid", [expect.objectContaining({ startLineNumber: 1, startColumn: 3 })]);
});
```

- [ ] **Step 2: Run client tests and verify RED**

Run: `pnpm --dir site/learn test -- beskidLspClient.test.ts`

Expected: FAIL because the client module does not exist.

- [ ] **Step 3: Implement one shared browser client**

```ts
export function attachBeskidLsp(editor: IStandaloneCodeEditor, monaco: Monaco, uri = "file:///workspace/Main.bd") {
  const client = new BeskidLspClient(new WebSocket(lspUrl()), monaco, editor.getModel()!, uri);
  return client.attach();
}
```

Send `initialize`, `initialized`, `didOpen`, and debounced full-text `didChange`. Register only providers backed by the client: completion, hover, definition, signature help, formatting, document symbols, and rename. Remove `playgroundCompletionItems` and the local provider registration.

- [ ] **Step 4: Run client tests and affected component tests**

Run: `pnpm --dir site/learn test -- beskidLspClient.test.ts playground.test.ts LessonWorkspace.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add site/learn/src/lib/beskidLspClient.ts site/learn/src/lib/beskidLspClient.test.ts site/learn/src/lib/playground.ts site/learn/src/components/Playground.tsx site/learn/src/components/lessonWorkspace/LessonWorkspace.tsx
git commit -m "feat(learn): use compiler-backed Monaco language features"
```

### Task 3: Build and end-to-end verification

**Files:**
- Modify: `site/learn/Dockerfile`
- Create: `scripts/ci/test/learn-lsp-image-contract.test.sh`
- Modify: `CHANGELOG.md`

**Interfaces:**
- Produces: Learn image containing executable `/app/site/learn/beskid` and `/app/site/learn/beskid_lsp`.
- Consumes: compiler workspace package `beskid_lsp` and Learn server `BESKID_LSP_BINARY` configuration.

- [ ] **Step 1: Write a failing image contract test**

```bash
assert_contains "${DOCKERFILE}" 'cargo build -p beskid_lsp --release' "learn image builds the real language server"
assert_contains "${DOCKERFILE}" '/workspace/target/release/beskid_lsp /workspace/runtime-output/beskid_lsp' "learn image stages the LSP binary"
assert_contains "${DOCKERFILE}" 'BESKID_LSP_BINARY=/app/site/learn/beskid_lsp' "learn server receives the staged LSP"
```

- [ ] **Step 2: Run image contract test and verify RED**

Run: `bash scripts/ci/test/learn-lsp-image-contract.test.sh`

Expected: FAIL because the image only ships `beskid`.

- [ ] **Step 3: Build and stage `beskid_lsp`**

Add `cargo build -p beskid_lsp --release`, stage the executable in the Rust image output, copy it into the Bun runtime image, and set `BESKID_LSP_BINARY`. Validate both executables with `--version` in the final image health preparation.

- [ ] **Step 4: Run image contract, Learn suite, typecheck, and Docker build**

Run: `bash scripts/ci/test/learn-lsp-image-contract.test.sh && pnpm --dir site/learn test && pnpm --dir site/learn typecheck && docker build -f site/learn/Dockerfile .`

Expected: PASS.

- [ ] **Step 5: Add changelog entry and commit**

```bash
git add site/learn/Dockerfile scripts/ci/test/learn-lsp-image-contract.test.sh CHANGELOG.md
git commit -m "feat(learn): ship compiler language server"
```

### Task 4: Release-gate verification

**Files:**
- Modify: `.github/workflows/platform-delivery.yml`
- Modify: `.github/workflows/reusable-image.yml`
- Modify: `.github/workflows/reusable-release-manifest.yml`
- Modify: `.github/workflows/reusable-promote.yml`
- Modify: `scripts/ci/test/platform-delivery-fail-closed.test.sh`

**Interfaces:**
- Produces: JSON image records passed as same-run workflow outputs and a base64 manifest passed to promotion; no required image-record artifact upload.

- [ ] **Step 1: Write failing release-gate contract tests**

```bash
assert_not_contains "${IMAGE_WORKFLOW}" 'Upload image manifest record' "required delivery metadata avoids quota-dependent artifacts"
assert_contains "${IMAGE_WORKFLOW}" 'record: ${{ steps.record.outputs.record }}' "image job exposes one immutable record"
assert_not_contains "${MANIFEST_WORKFLOW}" 'actions/download-artifact' "manifest consumes caller-owned records"
assert_not_contains "${DELIVERY_WORKFLOW}" "github.event_name != 'workflow_dispatch' || !inputs.unstable" "unstable release cannot bypass quality gates"
```

- [ ] **Step 2: Run contract tests and verify RED**

Run: `bash scripts/ci/test/platform-delivery-fail-closed.test.sh && bash scripts/ci/test/corelib-publish-contract.test.sh`

Expected: FAIL because the current workflow uploads required image records and skips quality jobs for unstable dispatches.

- [ ] **Step 3: Replace artifact handoff with fail-closed outputs**

Emit compact image-record JSON through reusable workflow outputs; aggregate exact records in the manifest workflow; encode the manifest in the reusable workflow output for promotion; validate the decoded manifest hash before deployment. Remove the unstable quality-gate skips.

- [ ] **Step 4: Run all release contract tests and platform integration gate**

Run: `bash scripts/ci/test/platform-delivery-fail-closed.test.sh && bash scripts/ci/test/corelib-publish-contract.test.sh && bash scripts/ci/platform-integration-gate.sh`

Expected: PASS in CI; local failures caused solely by unavailable platform tools are documented with their exact command.

- [ ] **Step 5: Commit and push for production verification**

```bash
git add .github/workflows scripts/ci/test CHANGELOG.md
git commit -m "fix(delivery): remove quota-dependent release handoff"
git push origin codex/learn-real-lsp:main
```

