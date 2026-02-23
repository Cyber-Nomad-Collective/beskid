use pecan_analysis::hir::AstProgram;
use pecan_analysis::resolve::{ResolveError, Resolver};
use pecan_analysis::syntax::Spanned;
use pecan_analysis::types::{type_program, TypeError};

use crate::syntax::util::parse_program_ast;

fn resolve_and_type(source: &str) -> Result<pecan_analysis::types::TypeResult, Vec<TypeError>> {
    let program = parse_program_ast(source);
    let hir: Spanned<AstProgram> = program.into();
    let resolution = Resolver::new()
        .resolve_program(&hir)
        .unwrap_or_else(|errors: Vec<ResolveError>| {
            panic!("expected resolver to succeed, got errors: {errors:?}")
        });
    type_program(&hir, &resolution)
}

#[test]
fn typing_literals_succeeds() {
    let result = resolve_and_type("unit main() { let x: i64 = 1; let y: bool = true; }");
    assert!(result.is_ok());
}

#[test]
fn typing_reports_mismatch() {
    let result = resolve_and_type("unit main() { let x: bool = 1; }");
    let errors = result.expect_err("expected type mismatch error");
    assert!(errors
        .iter()
        .any(|error| matches!(error, TypeError::TypeMismatch { .. })));
}

#[test]
fn typing_reports_non_bool_condition() {
    let result = resolve_and_type("unit main() { if 1 { let x: i64 = 1; } }");
    let errors = result.expect_err("expected non-bool condition error");
    assert!(errors
        .iter()
        .any(|error| matches!(error, TypeError::NonBoolCondition { .. })));
}

#[test]
fn typing_reports_return_mismatch() {
    let result = resolve_and_type("i64 main() { return true; }");
    let errors = result.expect_err("expected return type mismatch");
    assert!(errors
        .iter()
        .any(|error| matches!(error, TypeError::TypeMismatch { .. })));
}

#[test]
fn typing_function_calls_succeeds() {
    let result = resolve_and_type(
        "i64 add(a: i64, b: i64) { return a + b; } unit main() { let x: i64 = add(1, 2); }",
    );
    assert!(result.is_ok());
}

#[test]
fn typing_reports_call_arity_mismatch() {
    let result = resolve_and_type(
        "i64 add(a: i64, b: i64) { return a + b; } unit main() { let x: i64 = add(1); }",
    );
    let errors = result.expect_err("expected call arity mismatch");
    assert!(errors
        .iter()
        .any(|error| matches!(error, TypeError::CallArityMismatch { .. })));
}

#[test]
fn typing_struct_literal_and_member_access() {
    let result = resolve_and_type(
        "type User { i64 id, string name } unit main() { let u: User = User { id: 1, name: \"a\" }; let x: i64 = u.id; }",
    );
    if let Err(errors) = &result {
        panic!("expected struct literal/member typing to succeed, got errors: {errors:?}");
    }
    assert!(result.is_ok(), "unexpected typing failure");
}

#[test]
fn typing_reports_missing_struct_field() {
    let result = resolve_and_type(
        "type User { i64 id, string name } unit main() { let u: User = User { id: 1 }; }",
    );
    let errors = result.expect_err("expected missing struct field");
    assert!(
        errors
            .iter()
            .any(|error| matches!(error, TypeError::MissingStructField { .. })),
        "expected MissingStructField error, got: {errors:?}"
    );
}

#[test]
fn typing_match_expression_unifies_types() {
    let result = resolve_and_type(
        "enum Choice { Some(string value), None } unit main() { let opt: Choice = Choice::None(); let x: string = match opt { Choice::Some(value) => value, Choice::None => \"none\", }; }",
    );
    if let Err(errors) = &result {
        panic!("expected match typing to succeed, got errors: {errors:?}");
    }
    assert!(result.is_ok(), "unexpected match typing failure");
}

#[test]
fn typing_records_cast_intent_for_numeric_mismatch() {
    let result = resolve_and_type(
        "unit main() { let x: i64 = 1; let y: i32 = x; }",
    ).expect("expected typing to succeed with cast intent");
    assert!(!result.cast_intents.is_empty());
}

#[test]
fn typing_reports_enum_constructor_arity_mismatch() {
    let result = resolve_and_type(
        "enum Choice { Some(i64 value), None } unit main() { let x: Choice = Choice::Some(); }",
    );
    let errors = result.expect_err("expected enum constructor mismatch");
    assert!(
        errors
            .iter()
            .any(|error| matches!(error, TypeError::EnumConstructorMismatch { .. })),
        "expected EnumConstructorMismatch error, got: {errors:?}"
    );
}

#[test]
fn typing_reports_unknown_struct_field() {
    let result = resolve_and_type(
        "type User { i64 id, string name } unit main() { let u: User = User { id: 1, name: \"a\" }; let x: i64 = u.age; }",
    );
    let errors = result.expect_err("expected unknown struct field");
    assert!(
        errors
            .iter()
            .any(|error| matches!(error, TypeError::UnknownStructField { .. })),
        "expected UnknownStructField error, got: {errors:?}"
    );
}
