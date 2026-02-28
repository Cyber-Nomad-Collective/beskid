use beskid_abi::BeskidStr;
use beskid_abi::{
    RUNTIME_EXPORT_SYMBOLS, SYM_INTEROP_DISPATCH_PTR, SYM_INTEROP_DISPATCH_UNIT,
    SYM_INTEROP_DISPATCH_USIZE,
};
use beskid_interop_tooling::extractor::parse_spec_file;
use beskid_interop_tooling::generator::generate_runtime_source;
use beskid_runtime::interop_generated::{
    TAG_STRING_LEN, dispatch_ptr, dispatch_unit, dispatch_usize,
};
use std::fs;
use std::path::PathBuf;

#[repr(C)]
struct RuntimeInteropEnvelope {
    type_desc_ptr: *const u8,
    tag: i32,
    pad: i32,
    payload_ptr: *const BeskidStr,
}

#[test]
fn runtime_exports_include_all_interop_dispatch_symbols() {
    assert!(
        RUNTIME_EXPORT_SYMBOLS.contains(&SYM_INTEROP_DISPATCH_UNIT),
        "missing unit interop dispatch symbol export"
    );
    assert!(
        RUNTIME_EXPORT_SYMBOLS.contains(&SYM_INTEROP_DISPATCH_USIZE),
        "missing usize interop dispatch symbol export"
    );
    assert!(
        RUNTIME_EXPORT_SYMBOLS.contains(&SYM_INTEROP_DISPATCH_PTR),
        "missing ptr interop dispatch symbol export"
    );
}

#[test]
fn generated_runtime_source_matches_checked_in_runtime_file() {
    let runtime_root = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../beskid_runtime");
    let spec_path = runtime_root.join("interop_spec/std.rs");
    let runtime_generated_path = runtime_root.join("src/interop_generated.rs");

    let mut decls = parse_spec_file(&spec_path).expect("parse runtime interop spec");
    decls.sort();
    let expected = generate_runtime_source(&decls);
    let current =
        fs::read_to_string(&runtime_generated_path).expect("read runtime generated source");

    assert_eq!(
        current, expected,
        "runtime interop generated source is stale; run `pekan_cli interop`"
    );
}

#[test]
fn return_group_routing_uses_usize_dispatch_for_string_len_tag() {
    let hello = b"hello";
    let value = BeskidStr {
        ptr: hello.as_ptr(),
        len: hello.len(),
    };

    let envelope = RuntimeInteropEnvelope {
        type_desc_ptr: std::ptr::null(),
        tag: TAG_STRING_LEN,
        pad: 0,
        payload_ptr: &value,
    };

    let enum_ptr = &envelope as *const RuntimeInteropEnvelope as *const u8;
    let usize_result = unsafe { dispatch_usize(TAG_STRING_LEN, enum_ptr) };
    let unit_result = unsafe { dispatch_unit(TAG_STRING_LEN, enum_ptr) };
    let ptr_result = unsafe { dispatch_ptr(TAG_STRING_LEN, enum_ptr) };

    assert_eq!(usize_result, Some(5));
    assert!(
        !unit_result,
        "usize tag must not route through unit dispatch"
    );
    assert_eq!(
        ptr_result, None,
        "usize tag must not route through ptr dispatch"
    );
}

#[test]
fn unknown_tag_returns_fallback_for_all_return_groups() {
    let envelope = RuntimeInteropEnvelope {
        type_desc_ptr: std::ptr::null(),
        tag: 404,
        pad: 0,
        payload_ptr: std::ptr::null(),
    };

    let enum_ptr = &envelope as *const RuntimeInteropEnvelope as *const u8;
    assert!(!unsafe { dispatch_unit(404, enum_ptr) });
    assert_eq!(unsafe { dispatch_usize(404, enum_ptr) }, None);
    assert_eq!(unsafe { dispatch_ptr(404, enum_ptr) }, None);
}
