use pecan_analysis::hir::{
    lower_program, validate_hir_program, AstProgram, HirExpressionNode, HirItem, HirLegalityError,
    HirProgram, HirStatementNode,
};
use pecan_analysis::resolve::Resolver;
use pecan_analysis::syntax::Spanned;

use crate::syntax::util::parse_program_ast;

fn lower_and_resolve(source: &str) -> (Spanned<HirProgram>, pecan_analysis::resolve::Resolution) {
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
    let (hir, resolution) =
        lower_and_resolve("unit main() { let x: i64 = 1; let y: i64 = x; return; }");

    let errors = validate_hir_program(&hir, &resolution);
    assert!(errors.is_empty(), "expected no legality errors, got: {errors:?}");
}

#[test]
fn legality_reports_unresolved_value_path_when_resolution_entry_missing() {
    let (hir, mut resolution) =
        lower_and_resolve("unit main() { let x: i64 = 1; let y: i64 = x; }");

    let main_fn = hir
        .node
        .items
        .iter()
        .find_map(|item| match &item.node {
            HirItem::FunctionDefinition(def) if def.node.name.node.name == "main" => Some(def),
            _ => None,
        })
        .expect("expected main function");

    let HirStatementNode::LetStatement(second_let) = &main_fn.node.body.node.statements[1].node else {
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
