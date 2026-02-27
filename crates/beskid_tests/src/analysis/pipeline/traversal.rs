use beskid_analysis::analysis::rules::traversal::{
    HirChildNode, visit_expression_children, visit_statement_children,
};
use beskid_analysis::hir::{AstProgram, HirBlock, HirItem, HirProgram, HirStatementNode, lower_program};
use beskid_analysis::syntax::Spanned;

use crate::syntax::util::parse_program_ast;

fn parse_hir(source: &str) -> Spanned<HirProgram> {
    let ast_program = parse_program_ast(source);
    let ast: Spanned<AstProgram> = ast_program.into();
    lower_program(&ast)
}

fn function_body<'a>(hir: &'a Spanned<HirProgram>, name: &str) -> &'a Spanned<HirBlock> {
    for item in &hir.node.items {
        if let HirItem::FunctionDefinition(def) = &item.node
            && def.node.name.node.name == name
        {
            return &def.node.body;
        }
    }
    panic!("function `{name}` not found");
}

#[test]
fn traversal_statement_children_visit_order_if_statement() {
    let hir = parse_hir("i32 main() { if true { return 1; } else { return 2; } return 0; }");
    let body = function_body(&hir, "main");
    let if_statement = &body.node.statements[0];

    let mut seen = Vec::new();
    let mut on_child = |child: HirChildNode<'_>| match child {
        HirChildNode::Expr(_) => seen.push("expr"),
        HirChildNode::Block(_) => seen.push("block"),
    };

    visit_statement_children(if_statement, &mut on_child);

    assert_eq!(seen, vec!["expr", "block", "block"]);
}

#[test]
fn traversal_expression_children_visit_order_match_expression() {
    let hir = parse_hir("i32 main() { return match 1 { _ => 10, 2 => 20, }; }");
    let body = function_body(&hir, "main");
    let return_statement = &body.node.statements[0];
    let expr = match &return_statement.node {
        HirStatementNode::ReturnStatement(ret) => ret.node.value.as_ref().expect("return value"),
        _ => panic!("expected return statement"),
    };

    let mut seen = Vec::new();
    let mut on_child = |child: HirChildNode<'_>| match child {
        HirChildNode::Expr(_) => seen.push("expr"),
        HirChildNode::Block(_) => seen.push("block"),
    };

    visit_expression_children(expr, &mut on_child);

    assert_eq!(seen, vec!["expr", "expr", "expr"]);
}

#[test]
fn traversal_terminal_nodes_have_no_children() {
    let hir = parse_hir("i32 main() { 1; return 2; }");
    let body = function_body(&hir, "main");
    let expression_statement = &body.node.statements[0];
    let expr = match &expression_statement.node {
        HirStatementNode::ExpressionStatement(stmt) => &stmt.node.expression,
        _ => panic!("expected expression statement"),
    };

    let mut seen = 0;
    let mut on_child = |_child: HirChildNode<'_>| {
        seen += 1;
    };

    visit_expression_children(expr, &mut on_child);

    assert_eq!(seen, 0);
}
