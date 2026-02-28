use beskid_interop_tooling::extractor::parse_spec_file;
use beskid_interop_tooling::generator::generate_runtime_source;
use std::fs;
use std::path::PathBuf;

#[test]
fn extractor_parses_typed_interop_attr_path_and_name_override() {
    let path = std::env::temp_dir().join(format!(
        "interop_spec_extract_{}_{}.rs",
        std::process::id(),
        17
    ));
    let source = r#"
use beskid_abi::BeskidStr;

#[InteropCall(std::io, name = "println")]
fn sys_println(_text: *const BeskidStr) {}
"#;

    fs::write(&path, source).expect("write temp spec");
    let decls = parse_spec_file(&path).expect("parse spec declarations");

    assert_eq!(decls.len(), 1);
    let decl = &decls[0];
    assert_eq!(decl.module_path, "std.io");
    assert_eq!(decl.function_name, "println");
    assert_eq!(decl.runtime_symbol, "sys_println");

    let _ = fs::remove_file(path);
}

#[test]
fn generated_runtime_source_contains_dispatch_for_current_spec() {
    let spec_path =
        PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../beskid_runtime/interop_spec/std.rs");
    let mut decls = parse_spec_file(&spec_path).expect("parse runtime interop spec");
    decls.sort();

    let runtime_source = generate_runtime_source(&decls);
    assert!(runtime_source.contains("crate::builtins::sys_print("));
    assert!(runtime_source.contains("crate::builtins::sys_println("));
    assert!(runtime_source.contains("crate::builtins::str_len("));
}
