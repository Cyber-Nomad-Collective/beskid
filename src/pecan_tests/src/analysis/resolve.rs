use pecan_analysis::hir::AstProgram;
use pecan_analysis::resolve::{ResolveError, ResolveWarning, Resolver};
use pecan_analysis::syntax::Spanned;

use crate::syntax::util::parse_program_ast;

fn resolve_program(source: &str) -> Result<pecan_analysis::resolve::Resolution, Vec<ResolveError>> {
    let program = parse_program_ast(source);
    let hir: Spanned<AstProgram> = program.into();
    Resolver::new().resolve_program(&hir)
}

#[test]
fn duplicate_top_level_item_is_error() {
    let result = resolve_program("unit foo() { } unit foo() { }");
    let errors = result.expect_err("expected duplicate item error");
    assert!(matches!(
        errors.first(),
        Some(ResolveError::DuplicateItem { .. })
    ));
}

#[test]
fn duplicate_local_is_error() {
    let result = resolve_program("unit foo() { let x = 1; let x = 2; }");
    let errors = result.expect_err("expected duplicate local error");
    assert!(matches!(
        errors.first(),
        Some(ResolveError::DuplicateLocal { .. })
    ));
}

#[test]
fn unknown_value_is_error() {
    let result = resolve_program("unit foo() { let x = y; }");
    let errors = result.expect_err("expected unknown value error");
    assert!(matches!(
        errors.first(),
        Some(ResolveError::UnknownValue { .. })
    ));
}

#[test]
fn unknown_type_is_error() {
    let result = resolve_program("unit foo(x: Missing) { }");
    let errors = result.expect_err("expected unknown type error");
    assert!(matches!(
        errors.first(),
        Some(ResolveError::UnknownType { .. })
    ));
}

#[test]
fn shadowing_local_emits_warning() {
    let result = resolve_program("unit foo() { let x = 1; if true { let x = 2; } }")
        .expect("expected successful resolution");
    assert!(result
        .warnings
        .iter()
        .any(|warning| matches!(warning, ResolveWarning::ShadowedLocal { .. })));
}
