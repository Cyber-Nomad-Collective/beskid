use beskid_codegen::errors::CodegenError;
use beskid_codegen::lowering::lower_program;
use crate::codegen::util::lower_resolve_type;

#[test]
fn codegen_lowers_basic_function_to_clif() {
    let (hir, resolution, typed) = lower_resolve_type("i64 main() { i64 x = 1; return x; }");
    let artifact =
        lower_program(&hir, &resolution, &typed).expect("expected codegen lowering to succeed");
    assert_eq!(artifact.functions.len(), 1);
    let clif = artifact.functions[0].function.to_string();
    assert!(clif.contains("iconst"));
    assert!(clif.contains("return"));
}

#[test]
fn codegen_rejects_unsupported_expression_nodes_with_span() {
    let (hir, resolution, typed) = lower_resolve_type(
        "i64 main() { return match 1 { 1 => 2, _ => 3, }; }",
    );
    let errors = lower_program(&hir, &resolution, &typed)
        .expect_err("expected unsupported match node to fail codegen");
    assert!(
        errors
            .iter()
            .any(|error| matches!(error, CodegenError::UnsupportedNode { .. })),
        "expected UnsupportedNode error, got: {errors:?}"
    );
}

#[test]
fn codegen_lowers_numeric_cast_intent_via_sextend_or_ireduce() {
    let (hir, resolution, typed) =
        lower_resolve_type("i32 main() { i64 x = 1; return x; }");
    let artifact = lower_program(&hir, &resolution, &typed)
        .expect("expected numeric cast intent to be supported without error");
    let clif = artifact.functions[0].function.to_string();
    assert!(
        clif.contains("ireduce.i32"),
        "expected i64->i32 reduction in CLIF: {clif}"
    );
}

#[test]
fn codegen_lowers_for_loop_with_assignment() {
    let source = "i32 main() { i32 mut sum = 0; i32 start = 0; i32 end = 4; for i in range(start, end) { sum = sum + i; } return sum; }";
    let (hir, resolution, typed) = lower_resolve_type(source);
    let artifact =
        lower_program(&hir, &resolution, &typed).expect("expected for loop lowering to succeed");
    let clif = artifact.functions[0].function.to_string();
    assert!(clif.contains("brif"), "expected loop branching in CLIF: {clif}");
    assert!(clif.contains("iadd"), "expected loop increment in CLIF: {clif}");
}

#[test]
fn codegen_lowers_while_with_break_and_continue() {
    let source = "i32 main() { i32 mut i = 0; i32 mut sum = 0; while i < 5 { i = i + 1; if i == 2 { continue; } if i == 4 { break; } sum = sum + i; } return sum; }";
    let (hir, resolution, typed) = lower_resolve_type(source);
    let artifact = lower_program(&hir, &resolution, &typed)
        .expect("expected while/break/continue lowering to succeed");
    let clif = artifact.functions[0].function.to_string();
    assert!(clif.contains("brif"), "expected branching in CLIF: {clif}");
    assert!(clif.contains("jump"), "expected jumps for loop control in CLIF: {clif}");
}
