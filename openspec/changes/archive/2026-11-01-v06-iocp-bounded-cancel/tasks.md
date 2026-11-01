## 1. Validate

- [ ] 1.1 Validate this change with `openspec validate v06-iocp-bounded-cancel --strict --no-interactive` and regenerate `openspec/catalog.json` when it is applied.

## 2. Implement

- [x] 2.1 Add the bounded settle wait (`BeskidSettleAwait`, `BESKID_SETTLE_WAIT_MS`), the `ABANDONED` state, the late-packet poison rule (`BeskidSettleAbandonedPoisons`), and the drain bound (`BESKID_SETTLE_DRAIN_MS`) to `assembly/common/network_settle.h`.
- [x] 2.2 In `network_iocp.h`: settle with the bound and abandon on expiry; keep abandoned operations in their socket slot until the packet; poison stream sockets on a late transfer and reject their submits with `NET_CONNECTION_ABORTED`; let close leave a settling request to its cancel; bound the shutdown drain.
- [x] 2.3 Tests: fake-clock and abandoned-path replay in `tests/fixtures/network_settle.c`; real bounded wait and forced close packet on Windows in `tests/fixtures/network_settle_iocp.c`; source contract in `tests/network_iocp_settle.rs`.

## 3. Evidence

- [ ] 3.1 Linux and macOS: `cd compiler && cargo test --locked -p beskid_abi --test network_iocp_settle`.
- [ ] 3.2 Windows (Woodpecker windows pipeline, `cargo test --workspace`): `cd compiler && cargo test --locked -p beskid_abi --test network_iocp_settle`, and the IOCP kit run of `NetworkNativeTests.bd`.
