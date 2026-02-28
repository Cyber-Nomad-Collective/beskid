use beskid_analysis::hir::{AstProgram, HirContractMethodSignature, HirExpressionNode, HirProgram, lower_program};
use beskid_analysis::query::{HirNodeKind, HirQuery};
use beskid_analysis::syntax::Spanned;

use crate::syntax::util::parse_program_ast;

fn parse_hir(source: &str) -> Spanned<HirProgram> {
    let ast_program = parse_program_ast(source);
    let ast: Spanned<AstProgram> = ast_program.into();
    lower_program(&ast)
}

#[test]
fn hir_query_descendants_counts_nodes() {
    let hir = parse_hir("i32 main() { i32 x = 1; return x; }");
    let count = HirQuery::from(&hir.node).descendants().count();
    assert!(count > 6, "expected several HIR descendants, got {count}");
}

#[test]
fn hir_query_of_type_finds_contract_signatures() {
    let hir = parse_hir("contract Storage { unit put(key: string); unit get(); }");
    let signatures: Vec<&HirContractMethodSignature> =
        HirQuery::from(&hir.node).of::<HirContractMethodSignature>().collect();

    assert_eq!(signatures.len(), 2);
    assert_eq!(signatures[0].name.node.name, "put");
    assert_eq!(signatures[1].name.node.name, "get");
}

#[test]
fn hir_query_filter_typed_finds_match_expressions() {
    let hir = parse_hir("i32 main() { return match 1 { 1 => 10, _ => 20, }; }");
    let match_exprs: Vec<&HirExpressionNode> = HirQuery::from(&hir.node)
        .filter_typed::<HirExpressionNode>(|expr| matches!(expr, HirExpressionNode::MatchExpression(_)))
        .collect();

    assert_eq!(match_exprs.len(), 1);
}

#[test]
fn hir_query_filter_by_kind_finds_functions() {
    let hir = parse_hir("i32 main() { return 1; } i32 other() { return 2; }");
    let functions: Vec<_> = HirQuery::from(&hir.node)
        .filter(|node| node.node_kind() == HirNodeKind::FunctionDefinition)
        .collect();

    assert_eq!(functions.len(), 2);
}

#[test]
fn hir_query_find_first_identifier() {
    let hir = parse_hir("i32 main() { return 1; }");
    let ident = HirQuery::from(&hir.node)
        .find_first::<beskid_analysis::hir::HirIdentifier>()
        .expect("expected at least one HIR identifier");

    assert_eq!(ident.name, "main");
}
