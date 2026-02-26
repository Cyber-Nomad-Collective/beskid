use pecan_codegen::errors::CodegenError;
use pecan_codegen::lowering::lower_program;

use crate::codegen::util::lower_resolve_type;

#[test]
fn codegen_lowers_struct_literal_expression() {
    let (hir, resolution, typed) =
        lower_resolve_type("type User { i64 id } unit main() { User u = User { id: 1 }; }");
    let artifact = lower_program(&hir, &resolution, &typed)
        .expect("expected struct literal lowering to succeed");
    assert_eq!(artifact.functions.len(), 1);
}

#[test]
fn codegen_lowers_enum_constructor_expression() {
    let (hir, resolution, typed) = lower_resolve_type(
        "enum Choice { Some(i64 value), None } unit main() { Choice x = Choice::Some(1); }",
    );
    let artifact = lower_program(&hir, &resolution, &typed)
        .expect("expected enum constructor lowering to succeed");
    assert_eq!(artifact.functions.len(), 1);
}

#[test]
fn codegen_lowers_member_expression() {
    let (hir, resolution, typed) = lower_resolve_type(
        "type User { i64 id } unit main() { User u = User { id: 1 }; i64 x = u.id; }",
    );
    let artifact = lower_program(&hir, &resolution, &typed)
        .expect("expected member access lowering to succeed");
    assert_eq!(artifact.functions.len(), 1);
}

#[test]
fn codegen_rejects_function_parameter_modifiers() {
    let (hir, resolution, typed) =
        lower_resolve_type("i64 main(ref x: i64) { return x; }");
    let errors = lower_program(&hir, &resolution, &typed)
        .expect_err("expected function parameter modifier lowering to fail");
    assert!(errors.iter().any(|error| matches!(
        error,
        CodegenError::UnsupportedNode { node: "function parameter modifier", .. }
    )));
}
