## Why

The current lowering registers managed stack slots with the collector and releases them along each exit edge. Cranelift can compute which references are live at a safepoint and report their final stack locations. Using these locations lets the collector trace a temporary across an allocation and release an unused local before lexical scope exit.

## What Changes

Generate stack maps from typed reference facts, retain them in native modules, and publish the matching map while a managed frame can be collected. Use the same collector path for active frames and parked fibers. Switch generated program code to maps after linked conformance tests cover both. Provide versioned runtime-kit entry points for checkpoint publication.

## Impact

The change affects ISLE lowering, object and JIT emission, the ABI-v5 runtime kit and GC frame enumeration. It implements GC-006 of execution--runtime--memory-and-gc-runtime-contract. Downstream programs require a compiler and kit with matching ABI metadata.
