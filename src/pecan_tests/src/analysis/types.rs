use pecan_analysis::hir::{lower_program, AstProgram, HirProgram};
use pecan_analysis::resolve::{ResolveError, Resolver};
use pecan_analysis::syntax::Spanned;
use pecan_analysis::types::{type_program, TypeError};
use pecan_analysis::types::TypeInfo;
use pecan_analysis::hir::HirPrimitiveType;

use crate::syntax::util::parse_program_ast;

fn resolve_and_type(source: &str) -> Result<pecan_analysis::types::TypeResult, Vec<TypeError>> {
    let program = parse_program_ast(source);
    let ast: Spanned<AstProgram> = program.into();
    let hir: Spanned<HirProgram> = lower_program(&ast);
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
    let result = resolve_and_type("unit main() { let x: i64 = 1; let y: i32 = x; }")
        .expect("expected typing to succeed with cast intent");
    assert_eq!(result.cast_intents.len(), 1, "expected exactly one cast intent");

    let intent = &result.cast_intents[0];
    let from = result.types.get(intent.from);
    let to = result.types.get(intent.to);
    assert_eq!(from, Some(&TypeInfo::Primitive(HirPrimitiveType::I64)));
    assert_eq!(to, Some(&TypeInfo::Primitive(HirPrimitiveType::I32)));
}

#[test]
fn typing_cast_intents_are_sorted_by_source_span() {
    let result = resolve_and_type(
        "unit main() { let a: i64 = 1; let b: i32 = a; let c: i64 = 2; let d: i32 = c; }",
    )
    .expect("expected typing to succeed with cast intents");

    assert!(result.cast_intents.len() >= 2, "expected at least two cast intents");
    for pair in result.cast_intents.windows(2) {
        assert!(
            pair[0].span.start <= pair[1].span.start,
            "cast intents are not sorted by span start: {:?}",
            result.cast_intents
        );
    }
}

#[test]
fn typing_cast_intents_preserve_source_line_spans() {
    let result = resolve_and_type(
        "unit main() {\n  let x: i64 = 1;\n  let y: i32 = x;\n  let z: i64 = 2;\n  let w: i32 = z;\n}",
    )
    .expect("expected typing to succeed with cast intents");

    let lines: Vec<usize> = result
        .cast_intents
        .iter()
        .map(|intent| intent.span.line_col_start.0)
        .collect();
    assert_eq!(lines, vec![3, 5], "unexpected cast-intent line mapping: {lines:?}");
}

#[test]
fn typing_records_cast_intent_for_numeric_call_argument_mismatch() {
    let result = resolve_and_type(
        "i32 take(v: i32) { return v; } unit main() { let x: i64 = 1; let y: i32 = take(x); }",
    )
    .expect("expected typing to succeed with cast intent in call argument");

    assert!(
        !result.cast_intents.is_empty(),
        "expected cast intent for numeric call argument mismatch"
    );
}

#[test]
fn typing_records_cast_intent_for_numeric_return_mismatch() {
    let result = resolve_and_type("i32 main() { let x: i64 = 1; return x; }")
        .expect("expected typing to succeed with cast intent in return");

    assert!(
        !result.cast_intents.is_empty(),
        "expected cast intent for numeric return mismatch"
    );
}

#[test]
fn typing_cast_intent_accessor_finds_intent_by_span() {
    let result = resolve_and_type("unit main() { let x: i64 = 1; let y: i32 = x; }")
        .expect("expected typing to succeed with cast intent");
    let span = result.cast_intents[0].span;
    let found = result.cast_intent_for_span(span);
    assert!(found.is_some(), "expected cast intent to be retrievable by span");
}

#[test]
fn typing_nested_match_expression_unifies_types() {
    let result = resolve_and_type(
        "enum Choice { Some(i64 value), None } unit main() { let x: Choice = Choice::Some(1); let y: i64 = match x { Choice::Some(v) => match x { Choice::Some(_) => v, Choice::None => 0, }, Choice::None => 0, }; }",
    );
    if let Err(errors) = &result {
        panic!("expected nested match typing to succeed, got errors: {errors:?}");
    }
    assert!(result.is_ok(), "unexpected nested match typing failure");
}

#[test]
fn typing_reports_enum_pattern_arity_mismatch() {
    let result = resolve_and_type(
        "enum Choice { Some(i64 value), None } unit main() { let x: Choice = Choice::Some(1); let y: i64 = match x { Choice::Some() => 0, Choice::None => 1, }; }",
    );
    let errors = result.expect_err("expected enum pattern arity mismatch");
    assert!(
        errors
            .iter()
            .any(|error| matches!(error, TypeError::EnumConstructorMismatch { .. })),
        "expected EnumConstructorMismatch error, got: {errors:?}"
    );
}

#[test]
fn typing_reports_enum_pattern_field_type_mismatch() {
    let result = resolve_and_type(
        "enum Choice { Some(i64 value), None } unit main() { let x: Choice = Choice::Some(1); let y: i64 = match x { Choice::Some(\"text\") => 0, Choice::None => 1, }; }",
    );
    let errors = result.expect_err("expected enum pattern field type mismatch");
    assert!(
        errors
            .iter()
            .any(|error| matches!(error, TypeError::TypeMismatch { .. })),
        "expected TypeMismatch error, got: {errors:?}"
    );
}

#[test]
fn typing_grouped_expression_propagates_type() {
    let result = resolve_and_type("unit main() { let x: i64 = (1); }");
    assert!(result.is_ok(), "expected grouped expression typing to succeed");
}

#[test]
fn typing_block_expression_propagates_unit_type() {
    let result = resolve_and_type("unit main() { let x: unit = { let y: i64 = 1; }; }");
    assert!(result.is_ok(), "expected block expression typing to succeed");
}

#[test]
fn typing_reports_invalid_member_target_for_non_struct() {
    let result = resolve_and_type("unit main() { let x: i64 = 1; let y: i64 = x.foo; }");
    let errors = result.expect_err("expected invalid member target error");
    assert!(
        errors
            .iter()
            .any(|error| matches!(error, TypeError::InvalidMemberTarget { .. })),
        "expected InvalidMemberTarget error, got: {errors:?}"
    );
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
