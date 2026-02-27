use std::collections::HashSet;
use std::path::PathBuf;

use beskid_abi::{
    BESKID_RUNTIME_ABI_VERSION, BUILTIN_SPECS, BeskidArray, BeskidStr, RUNTIME_EXPORT_SYMBOLS,
    SYM_ABI_VERSION, SYM_ALLOC, SYM_ARRAY_NEW, SYM_GC_REGISTER_ROOT, SYM_GC_ROOT_HANDLE,
    SYM_GC_UNREGISTER_ROOT, SYM_GC_UNROOT_HANDLE, SYM_GC_WRITE_BARRIER, SYM_INTEROP_DISPATCH_PTR,
    SYM_INTEROP_DISPATCH_UNIT, SYM_INTEROP_DISPATCH_USIZE, SYM_PANIC, SYM_PANIC_STR, SYM_STR_LEN,
    SYM_STR_NEW,
};
use beskid_aot::runtime::{RuntimeBuildRequest, prepare_runtime};
use beskid_aot::{AotError, BuildProfile, RuntimeStrategy};

#[test]
fn builtin_symbols_are_unique() {
    let set: HashSet<&'static str> = BUILTIN_SPECS.iter().map(|spec| spec.symbol).collect();
    assert_eq!(set.len(), BUILTIN_SPECS.len());
}

#[test]
fn runtime_export_symbols_match_frozen_allowlist_snapshot() {
    let expected = vec![
        SYM_ABI_VERSION,
        SYM_ALLOC,
        SYM_STR_NEW,
        SYM_STR_LEN,
        SYM_ARRAY_NEW,
        SYM_PANIC,
        SYM_PANIC_STR,
        SYM_GC_WRITE_BARRIER,
        SYM_GC_ROOT_HANDLE,
        SYM_GC_UNROOT_HANDLE,
        SYM_GC_REGISTER_ROOT,
        SYM_GC_UNREGISTER_ROOT,
        SYM_INTEROP_DISPATCH_UNIT,
        SYM_INTEROP_DISPATCH_PTR,
        SYM_INTEROP_DISPATCH_USIZE,
    ];
    assert_eq!(RUNTIME_EXPORT_SYMBOLS, expected);
}

#[test]
fn runtime_export_symbols_are_unique() {
    let set: HashSet<&'static str> = RUNTIME_EXPORT_SYMBOLS.iter().copied().collect();
    assert_eq!(set.len(), RUNTIME_EXPORT_SYMBOLS.len());
}

#[test]
fn prebuilt_runtime_requires_abi_version() {
    let path = PathBuf::from("/tmp/nonexistent-runtime-archive.a");
    let request = RuntimeBuildRequest {
        strategy: RuntimeStrategy::UsePrebuilt {
            path,
            abi_version: None,
        },
        target_triple: None,
        profile: BuildProfile::Debug,
        work_dir: std::env::temp_dir().join("beskid_tests_abi_version_required"),
    };

    let err = prepare_runtime(&request).expect_err("expected ABI version requirement failure");
    assert!(matches!(err, AotError::RuntimeAbiVersionRequired));
}

#[test]
fn prebuilt_runtime_rejects_wrong_abi_version() {
    let path = PathBuf::from("/tmp/nonexistent-runtime-archive.a");
    let request = RuntimeBuildRequest {
        strategy: RuntimeStrategy::UsePrebuilt {
            path,
            abi_version: Some(BESKID_RUNTIME_ABI_VERSION + 1),
        },
        target_triple: None,
        profile: BuildProfile::Debug,
        work_dir: std::env::temp_dir().join("beskid_tests_abi_version_mismatch"),
    };

    let err = prepare_runtime(&request).expect_err("expected ABI mismatch failure");
    assert!(matches!(
        err,
        AotError::RuntimeAbiMismatch {
            expected,
            actual
        } if expected == BESKID_RUNTIME_ABI_VERSION && actual == BESKID_RUNTIME_ABI_VERSION + 1
    ));
}

#[test]
fn prebuilt_runtime_missing_archive_fails() {
    let path = PathBuf::from("/tmp/missing-beskid-runtime-archive.a");
    let request = RuntimeBuildRequest {
        strategy: RuntimeStrategy::UsePrebuilt {
            path: path.clone(),
            abi_version: Some(BESKID_RUNTIME_ABI_VERSION),
        },
        target_triple: None,
        profile: BuildProfile::Debug,
        work_dir: std::env::temp_dir().join("beskid_tests_abi_archive_missing"),
    };

    let err = prepare_runtime(&request).expect_err("expected missing archive failure");
    assert!(matches!(err, AotError::RuntimeArchiveMissing { path: missing } if missing == path));
}

#[test]
fn ffi_types_have_stable_sizes() {
    assert_eq!(
        std::mem::size_of::<BeskidStr>(),
        std::mem::size_of::<usize>() * 2
    );
    assert_eq!(
        std::mem::size_of::<BeskidArray>(),
        std::mem::size_of::<usize>() * 3
    );
}
