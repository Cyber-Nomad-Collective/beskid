use beskid_engine::services::run_entrypoint;
use std::path::Path;

fn run_main_output(source: &str) -> String {
    run_entrypoint(Path::new("<jit_callable_test>"), source, "main")
        .expect("expected JIT entrypoint execution to succeed")
}

fn assert_pointer_hex(output: &str) {
    assert!(
        output.starts_with("0x"),
        "expected pointer-like output to start with 0x, got: {output}"
    );
    assert_eq!(output.len(), 18, "expected 64-bit pointer hex width");
    assert!(
        output
            .chars()
            .skip(2)
            .all(|ch| ch.is_ascii_hexdigit() && !ch.is_ascii_uppercase()),
        "expected lowercase hexadecimal pointer output, got: {output}"
    );
}

#[test]
fn jit_callable_formats_unit_as_ok() {
    let output = run_main_output("unit main() { }");
    assert_eq!(output, "ok");
}

#[test]
fn jit_callable_formats_i64() {
    let output = run_main_output("i64 main() { return 42; }");
    assert_eq!(output, "42");
}

#[test]
fn jit_callable_formats_bool() {
    let output = run_main_output("bool main() { return true; }");
    assert_eq!(output, "true");
}

#[test]
fn jit_callable_formats_char() {
    let output = run_main_output("char main() { return 'A'; }");
    assert_eq!(output, "A");
}

#[test]
fn jit_callable_formats_pointer_like_result() {
    let output = run_main_output("string main() { return \"hello\"; }");
    assert_pointer_hex(&output);
}
