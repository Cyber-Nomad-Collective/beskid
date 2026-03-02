use beskid_analysis::hir::{
    AstProgram, HirExpressionNode, HirItem, HirLegalityError, HirProgram, HirStatementNode,
    lower_program, validate_hir_program,
};
use beskid_analysis::resolve::Resolver;
use beskid_analysis::syntax::Spanned;

use crate::syntax::util::parse_program_ast;

fn lower_and_resolve(source: &str) -> (Spanned<HirProgram>, beskid_analysis::resolve::Resolution) {
    let program = parse_program_ast(source);
    let ast: Spanned<AstProgram> = program.into();
    let hir: Spanned<HirProgram> = lower_program(&ast);
    let resolution = Resolver::new()
        .resolve_program(&hir)
        .expect("expected resolution to succeed");
    (hir, resolution)
}

#[test]
fn legality_passes_for_valid_program() {
    let (hir, resolution) = lower_and_resolve("unit main() { i64 x = 1; i64 y = x; return; }");

    let errors = validate_hir_program(&hir, &resolution);
    assert!(
        errors.is_empty(),
        "expected no legality errors, got: {errors:?}"
    );
}

#[test]
fn legality_reports_unresolved_value_path_when_resolution_entry_missing() {
    let (hir, mut resolution) = lower_and_resolve("unit main() { i64 x = 1; i64 y = x; }");

    let main_fn = hir
        .node
        .items
        .iter()
        .find_map(|item| match &item.node {
            HirItem::FunctionDefinition(def) if def.node.name.node.name == "main" => Some(def),
            _ => None,
        })
        .expect("expected main function");

    let HirStatementNode::LetStatement(second_let) = &main_fn.node.body.node.statements[1].node
    else {
        panic!("expected second let statement");
    };
    let HirExpressionNode::PathExpression(path_expr) = &second_let.node.value.node else {
        panic!("expected second let value to be a path expression");
    };

    resolution
        .tables
        .resolved_values
        .remove(&path_expr.node.path.span);

    let errors = validate_hir_program(&hir, &resolution);
    assert!(
        errors
            .iter()
            .any(|error| matches!(error, HirLegalityError::UnresolvedValuePath { .. })),
        "expected unresolved value-path legality error, got: {errors:?}"
    );
}

#[test]
fn legality_reports_invalid_span_invariants() {
    let (mut hir, resolution) = lower_and_resolve("unit main() { return; }");
    hir.span.start = hir.span.end + 1;

    let errors = validate_hir_program(&hir, &resolution);
    assert!(
        errors
            .iter()
            .any(|error| matches!(error, HirLegalityError::InvalidSpan { .. })),
        "expected invalid-span legality error, got: {errors:?}"
    );
}

#[test]
fn legality_reports_unknown_attribute_target_kind() {
    let source = "attribute Builder(UnknownDeclaration) { enabled: bool = true }";
    let (hir, resolution) = lower_and_resolve(source);

    let errors = validate_hir_program(&hir, &resolution);
    assert!(
        errors
            .iter()
            .any(|error| matches!(error, HirLegalityError::UnknownAttributeTarget { .. })),
        "expected unknown attribute-target legality error, got: {errors:?}"
    );
}

#[test]
fn legality_reports_duplicate_attribute_targets() {
    let source =
        "attribute Builder(TypeDeclaration, TypeDeclaration) { enabled: bool = true }";
    let (hir, resolution) = lower_and_resolve(source);

    let errors = validate_hir_program(&hir, &resolution);
    assert!(
        errors
            .iter()
            .any(|error| matches!(error, HirLegalityError::DuplicateAttributeTarget { .. })),
        "expected duplicate attribute-target legality error, got: {errors:?}"
    );
}

#[test]
fn legality_reports_attribute_target_not_allowed() {
    let source = "attribute Extern(ContractDeclaration) { Abi: string = \"C\" } [Extern(Abi: \"C\")] mod sys.io;";
    let (hir, resolution) = lower_and_resolve(source);

    let errors = validate_hir_program(&hir, &resolution);
    assert!(
        errors
            .iter()
            .any(|error| matches!(error, HirLegalityError::AttributeTargetNotAllowed { .. })),
        "expected attribute-target-not-allowed legality error, got: {errors:?}"
    );
}

#[test]
fn legality_reports_attribute_target_not_allowed_on_contract() {
    let source = "attribute Native(ModuleDeclaration) { Abi: string = \"C\" } [Native(Abi: \"C\")] contract Reader { i32 read(p: u8[]); }";
    let (hir, resolution) = lower_and_resolve(source);

    let errors = validate_hir_program(&hir, &resolution);
    assert!(
        errors
            .iter()
            .any(|error| matches!(error, HirLegalityError::AttributeTargetNotAllowed { .. })),
        "expected contract attribute-target-not-allowed legality error, got: {errors:?}"
    );
}

#[test]
fn legality_reports_attribute_target_not_allowed_on_inline_module() {
    let source = "attribute Native(ContractDeclaration) { Abi: string = \"C\" } [Native(Abi: \"C\")] mod sys { unit noop() { return; } }";
    let (hir, resolution) = lower_and_resolve(source);

    let errors = validate_hir_program(&hir, &resolution);
    assert!(
        errors
            .iter()
            .any(|error| matches!(error, HirLegalityError::AttributeTargetNotAllowed { .. })),
        "expected inline-module attribute-target-not-allowed legality error, got: {errors:?}"
    );
}

#[test]
fn legality_allows_attribute_when_target_matches_module_and_contract() {
    let source = "attribute Native(ModuleDeclaration, ContractDeclaration) { Abi: string = \"C\" } [Native(Abi: \"C\")] mod sys.io; [Native(Abi: \"C\")] contract Reader { i32 read(p: u8[]); }";
    let (hir, resolution) = lower_and_resolve(source);

    let errors = validate_hir_program(&hir, &resolution);
    assert!(
        !errors
            .iter()
            .any(|error| matches!(error, HirLegalityError::AttributeTargetNotAllowed { .. })),
        "expected no attribute-target-not-allowed legality error, got: {errors:?}"
    );
}

#[test]
fn legality_allows_attribute_without_target_list() {
    let source = "attribute Marker { enabled: bool = true } [Marker(enabled: true)] mod sys.io; [Marker(enabled: true)] contract Reader { i32 read(p: u8[]); }";
    let (hir, resolution) = lower_and_resolve(source);

    let errors = validate_hir_program(&hir, &resolution);
    assert!(
        !errors
            .iter()
            .any(|error| matches!(error, HirLegalityError::AttributeTargetNotAllowed { .. })),
        "expected unconstrained attribute declaration to allow all targets, got: {errors:?}"
    );
}
