## 1. Implement

- [x] 1.1 Classify managed locals, temporaries and compiler-created values across all lowering paths.
- [x] 1.2 Serialize machine stack maps with correct code and data relocations for AOT and Engine modules.
- [x] 1.3 Publish precise roots for active and parked frames and validate the runtime-kit ABI.
- [x] 1.4 Remove generated stack-slot registrations, construction handles and the leaf registration elision after cutover.

## 2. Verify

- [x] 2.1 Verify live and dead objects in a linked optimized program with maps as the sole protection.
- [x] 2.2 Verify reentrant host callbacks, parked fibers, loop safepoints and temporary arguments under collection stress.
- [x] 2.3 Qualify the final default compiler on native Linux x64, Windows x64 and macOS arm64.
- [x] 2.4 Measure fixture pause time, checkpoint overhead and metadata size.

The default compiler passed the linked AOT callback (debug and release), Engine JIT and parked-fiber stress tests on Linux x64, Windows Server x64 MSVC and macOS arm64. All three native runs used compiler source snapshot SHA-256 `bce1250e7541cc9a269186fa664eea5ec010ccbf3bb4d2d18b7c29a194901e49`. The Linux negative control still detects the lost live object when checkpoint publication is disabled. The mixed runtime fixtures also lower with nonempty maps in their managed functions. On Linux the canonical GC and scheduler suites each passed all ten tests. The 6000-frame recursion fixture passed in JIT, static AOT and native-kit execution.

The Linux callback fixture used 416 bytes of stack-map data with sole map protection and 800 bytes with dual protection, in both AOT profiles. With live callback roots, 1,000 collections averaged 3.43 microseconds on the release kit. A separate Linux release-kit microbenchmark took a median 30.71 ns per push/pop pair over seven batches of one million pairs. Median empty-heap collection was 449.60 ns over seven batches of ten thousand collections. These local measurements characterize the fixtures. Application workload pause measurements remain open for release.
