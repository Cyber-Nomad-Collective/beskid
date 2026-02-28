use beskid_interop_tooling::generator::{check_generated_file, generate_runtime_source};
use beskid_interop_tooling::{InteropDecl, InteropParam, ReturnGroup};
use std::fs;
use std::path::PathBuf;

#[test]
fn runtime_source_generation_contains_dispatch_mapping() {
    let decls = vec![
        InteropDecl {
            module_path: "std.io".to_string(),
            function_name: "println".to_string(),
            runtime_symbol: "sys_println".to_string(),
            variant_name: "IoPrintln".to_string(),
            params: vec![InteropParam {
                name: "text".to_string(),
                beskid_type: "string".to_string(),
            }],
            return_group: ReturnGroup::Unit,
            source: PathBuf::from("spec.rs"),
            line: 1,
        },
        InteropDecl {
            module_path: "std.string".to_string(),
            function_name: "len".to_string(),
            runtime_symbol: "str_len".to_string(),
            variant_name: "StringLen".to_string(),
            params: vec![InteropParam {
                name: "text".to_string(),
                beskid_type: "string".to_string(),
            }],
            return_group: ReturnGroup::Usize,
            source: PathBuf::from("spec.rs"),
            line: 2,
        },
        InteropDecl {
            module_path: "std.ptr".to_string(),
            function_name: "alloc_raw".to_string(),
            runtime_symbol: "alloc".to_string(),
            variant_name: "PtrAllocRaw".to_string(),
            params: vec![],
            return_group: ReturnGroup::Ptr,
            source: PathBuf::from("spec.rs"),
            line: 3,
        },
    ];

    let runtime_source = generate_runtime_source(&decls);
    assert!(runtime_source.contains("dispatch_unit"));
    assert!(runtime_source.contains("dispatch_usize"));
    assert!(runtime_source.contains("dispatch_ptr"));
    assert!(runtime_source.contains("crate::builtins::sys_println"));
    assert!(runtime_source.contains("Some(crate::builtins::str_len"));
    assert!(runtime_source.contains("Some(crate::builtins::alloc("));
    assert!(runtime_source.contains("TAG_IO_PRINTLN"));
    assert!(runtime_source.contains("TAG_STRING_LEN"));
    assert!(runtime_source.contains("TAG_PTR_ALLOC_RAW"));
}

#[test]
fn check_generated_file_reports_stale_output() {
    let path = std::env::temp_dir().join(format!(
        "interop_check_test_{}_{}.bd",
        std::process::id(),
        23
    ));
    fs::write(&path, "old").expect("write temp file");

    let err = check_generated_file(&path, "new").expect_err("expected stale mismatch");
    let message = err.to_string();
    assert!(
        message.contains("stale"),
        "expected stale file error message"
    );
    assert!(
        message.contains("pekan_cli interop"),
        "expected stale file error to include regeneration command"
    );

    let _ = fs::remove_file(path);
}
