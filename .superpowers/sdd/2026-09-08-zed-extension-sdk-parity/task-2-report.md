# Task 2 report: move and lock the Zed extension package

## RED

After updating `scripts/ci/test/zed-extension-package.test.sh` to require the
`editors/zed` package boundary and `wasm32-wasip2`, before moving production
files:

```text
$ bash scripts/ci/test/zed-extension-package.test.sh
FAIL: missing editors/zed Cargo package
exit=1
```

## GREEN

The package was moved to `editors/zed`, the manifest language-server
declaration was updated to the SDK's current `languages`/`language_ids` shape,
and the MIT license was added. The release component was copied to
`editors/zed/extension.wasm`.

```text
$ rustup target add wasm32-wasip2
info: component 'rust-std' for target 'wasm32-wasip2' is up to date

$ RUSTC="$(rustup which rustc --toolchain stable)" cargo build --release \
    --target wasm32-wasip2 --manifest-path editors/zed/Cargo.toml -j2
Finished `release` profile [optimized] target(s) in 30.68s

$ bash scripts/ci/test/zed-extension-package.test.sh
Finished `test` profile [unoptimized + debuginfo] target(s) in 11.60s
running 0 tests
test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out
Finished `release` profile [optimized] target(s) in 8.43s
Zed extension package tests OK
```

The package test selects the rustup-managed stable compiler when available;
this is necessary on the current host because the active Homebrew Rust shim
does not contain its advertised WASI standard-library files.
