use pecan_analysis::hir::{lower_program, normalize_program, AstProgram, HirProgram};
use pecan_analysis::resolve::{ResolveError, ResolveWarning, Resolver};
use pecan_analysis::syntax::Spanned;

use crate::syntax::util::parse_program_ast;

fn resolve_program(source: &str) -> Result<pecan_analysis::resolve::Resolution, Vec<ResolveError>> {
    let program = parse_program_ast(source);
    let ast: Spanned<AstProgram> = program.into();
    let mut hir: Spanned<HirProgram> = lower_program(&ast);
    normalize_program(&mut hir).expect("normalization failed");
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

#[test]
fn shadowing_item_with_local_emits_warning() {
    let result = resolve_program("unit x() { } unit foo() { let x = 1; }")
        .expect("expected successful resolution");
    assert!(result
        .warnings
        .iter()
        .any(|warning| matches!(warning, ResolveWarning::ShadowedLocal { .. })));
}

#[test]
fn qualified_value_path_with_missing_module_is_error() {
    let result = resolve_program("unit foo() { let x = dep.thing; }");
    let errors = result.expect_err("expected unknown module path error");
    assert!(errors
        .iter()
        .any(|error| matches!(error, ResolveError::UnknownModulePath { .. })));
}

#[test]
fn qualified_value_path_with_known_module_and_missing_symbol_is_error() {
    let result = resolve_program("mod dep; unit foo() { let x = dep.thing; }");
    let errors = result.expect_err("expected unknown value in module error");
    assert!(errors
        .iter()
        .any(|error| matches!(error, ResolveError::UnknownValueInModule { .. })));
}

#[test]
fn qualified_type_path_with_known_module_and_missing_symbol_is_error() {
    let result = resolve_program("mod dep; unit foo(x: dep.Missing) { }");
    let errors = result.expect_err("expected unknown type in module error");
    assert!(errors
        .iter()
        .any(|error| matches!(error, ResolveError::UnknownTypeInModule { .. })));
}

#[test]
fn qualified_module_path_to_private_item_is_error() {
    let result = resolve_program("mod dep.secret; unit foo() { let x = dep.secret; }");
    let errors = result.expect_err("expected private item in module error");
    assert!(errors
        .iter()
        .any(|error| matches!(error, ResolveError::PrivateItemInModule { .. })));
}

#[test]
fn qualified_module_path_to_public_item_is_allowed() {
    let result = resolve_program("pub mod dep.secret; unit foo() { let x = dep.secret; }");
    assert!(result.is_ok(), "expected qualified access to public module item to resolve");
}

#[test]
fn stdio_println_resolves() {
    let result = resolve_program("unit main() { std.io.println(\"hi\"); }")
        .expect("expected std.io.println to resolve");
    assert!(result.warnings.is_empty());
}
