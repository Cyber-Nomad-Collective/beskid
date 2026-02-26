use beskid_analysis::hir::{
    lower_program, normalize_program, AstItem, AstProgram, HirExpressionNode, HirItem, HirPattern, HirStatementNode,
    HirProgram,
};
use beskid_analysis::syntax::Spanned;

use crate::syntax::util::parse_program_ast;

fn sample_source() -> &'static str {
    "enum Option { Some(i64 value), None }\n\
     type User { i64 id, string name }\n\
     unit main() {\n\
       User u = User { id: 1, name: \"a\" };\n\
       i64 x = u.id;\n\
       Option y = Option::Some(1);\n\
       i64 z = match y { Option::Some(v) => v, Option::None => 0, };\n\
       if true { return; }\n\
     }"
}

fn lower_sample_program() -> (Spanned<AstProgram>, Spanned<HirProgram>) {
    let program = parse_program_ast(sample_source());
    let ast: Spanned<AstProgram> = program.into();
    let mut hir: Spanned<HirProgram> = lower_program(&ast);
    normalize_program(&mut hir).expect("normalization failed");
    (ast, hir)
}

#[test]
fn lowering_preserves_item_spans_and_names() {
    let (ast, hir) = lower_sample_program();

    assert_eq!(ast.node.items.len(), hir.node.items.len());

    for (ast_item, hir_item) in ast.node.items.iter().zip(hir.node.items.iter()) {
        assert_eq!(ast_item.span, hir_item.span);
        match (&ast_item.node, &hir_item.node) {
            (AstItem::EnumDefinition(ast_def), HirItem::EnumDefinition(hir_def)) => {
                assert_eq!(ast_def.node.name.node.name, hir_def.node.name.node.name);
            }
            (AstItem::TypeDefinition(ast_def), HirItem::TypeDefinition(hir_def)) => {
                assert_eq!(ast_def.node.name.node.name, hir_def.node.name.node.name);
            }
            (AstItem::FunctionDefinition(ast_def), HirItem::FunctionDefinition(hir_def)) => {
                assert_eq!(ast_def.node.name.node.name, hir_def.node.name.node.name);
            }
            _ => panic!("unexpected item pairing in lowering test"),
        }
    }
}

#[test]
fn lowering_maps_statement_and_expression_kinds() {
    let (_ast, hir) = lower_sample_program();
    let main_fn = hir
        .node
        .items
        .iter()
        .find_map(|item| match &item.node {
            HirItem::FunctionDefinition(def) if def.node.name.node.name == "main" => Some(def),
            _ => None,
        })
        .expect("expected main function");

    let statements = &main_fn.node.body.node.statements;
    assert!(statements.iter().any(|statement| {
        matches!(statement.node, HirStatementNode::IfStatement(_))
    }));

    let mut saw_struct_literal = false;
    let mut saw_member = false;
    let mut saw_enum_constructor = false;
    let mut saw_match = false;

    for statement in statements {
        let HirStatementNode::LetStatement(let_stmt) = &statement.node else {
            continue;
        };
        match &let_stmt.node.value.node {
            HirExpressionNode::StructLiteralExpression(_) => saw_struct_literal = true,
            HirExpressionNode::MemberExpression(_) | HirExpressionNode::PathExpression(_) => {
                saw_member = true
            }
            HirExpressionNode::EnumConstructorExpression(_) => saw_enum_constructor = true,
            HirExpressionNode::MatchExpression(_) => saw_match = true,
            _ => {}
        }
    }

    assert!(saw_struct_literal, "expected struct literal let binding");
    assert!(saw_member, "expected member access let binding");
    assert!(saw_enum_constructor, "expected enum constructor let binding");
    assert!(saw_match, "expected match let binding");
}

#[test]
fn lowering_preserves_match_patterns() {
    let (_ast, hir) = lower_sample_program();
    let main_fn = hir
        .node
        .items
        .iter()
        .find_map(|item| match &item.node {
            HirItem::FunctionDefinition(def) if def.node.name.node.name == "main" => Some(def),
            _ => None,
        })
        .expect("expected main function");

    let HirStatementNode::LetStatement(match_let) = &main_fn.node.body.node.statements[3].node else {
        panic!("expected match let statement");
    };
    let HirExpressionNode::MatchExpression(match_expr) = &match_let.node.value.node else {
        panic!("expected match expression");
    };

    assert_eq!(match_expr.node.arms.len(), 2);
    let first_pattern = &match_expr.node.arms[0].node.pattern;
    assert!(matches!(first_pattern.node, HirPattern::Enum(_)));
}
