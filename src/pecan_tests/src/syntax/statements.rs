use pecan_analysis::parsing::parsable::Parsable;
use pecan_analysis::syntax::{Block, Statement};
use pecan_analysis::Rule;

use crate::parsing::util::parse_pair;
use crate::syntax::util::{assert_expression_integer, assert_expression_path_segments, parse_statement_ast};

#[test]
fn parses_let_statement_ast() {
    let statement = parse_statement_ast(Rule::LetStatement, "let mut age: i32 = 42;");
    match &statement.node {
        Statement::Let(let_stmt) => {
            assert!(let_stmt.node.mutable);
            assert_eq!(let_stmt.node.name.node.name, "age");
            assert!(let_stmt.node.type_annotation.is_some());
            let type_annotation = let_stmt.node.type_annotation.as_ref().expect("type annotation");
            assert!(matches!(type_annotation.node, pecan_analysis::syntax::Type::Primitive(_)));
            assert_expression_integer(&let_stmt.node.value, "42");
        }
        _ => panic!("expected let statement"),
    }
}

#[test]
fn parses_return_statement_ast() {
    let statement = parse_statement_ast(Rule::ReturnStatement, "return 1;");
    match &statement.node {
        Statement::Return(ret) => {
            assert!(ret.node.value.is_some());
            let value = ret.node.value.as_ref().expect("return value");
            assert_expression_integer(value, "1");
        }
        _ => panic!("expected return statement"),
    }
}

#[test]
fn parses_break_and_continue_statements() {
    let break_stmt = parse_statement_ast(Rule::BreakStatement, "break;");
    assert!(matches!(break_stmt.node, Statement::Break(_)));

    let continue_stmt = parse_statement_ast(Rule::ContinueStatement, "continue;");
    assert!(matches!(continue_stmt.node, Statement::Continue(_)));
}

#[test]
fn parses_if_statement_ast() {
    let statement = parse_statement_ast(Rule::IfStatement, "if cond { return 1; } else { return 2; }");
    match &statement.node {
        Statement::If(if_stmt) => {
            assert_expression_path_segments(&if_stmt.node.condition, &["cond"]);
            assert_eq!(if_stmt.node.then_block.node.statements.len(), 1);
            assert!(if_stmt.node.else_block.is_some());
            let else_block = if_stmt.node.else_block.as_ref().expect("else block");
            assert_eq!(else_block.node.statements.len(), 1);
        }
        _ => panic!("expected if statement"),
    }
}

#[test]
fn parses_while_statement_ast() {
    let statement = parse_statement_ast(Rule::WhileStatement, "while cond { break; }");
    match &statement.node {
        Statement::While(while_stmt) => {
            assert_expression_path_segments(&while_stmt.node.condition, &["cond"]);
            assert_eq!(while_stmt.node.body.node.statements.len(), 1);
        }
        _ => panic!("expected while statement"),
    }
}

#[test]
fn parses_for_statement_ast() {
    let statement = parse_statement_ast(Rule::ForStatement, "for i in range(0, 10) { continue; }");
    match &statement.node {
        Statement::For(for_stmt) => {
            assert_eq!(for_stmt.node.iterator.node.name, "i");
            match &for_stmt.node.range.node.start.node {
                pecan_analysis::syntax::Expression::Literal(_) => {
                    assert_expression_integer(&for_stmt.node.range.node.start, "0");
                }
                _ => panic!("expected range start literal"),
            }
            assert_expression_integer(&for_stmt.node.range.node.end, "10");
            assert_eq!(for_stmt.node.body.node.statements.len(), 1);
        }
        _ => panic!("expected for statement"),
    }
}

#[test]
fn parses_expression_statement_ast() {
    let statement = parse_statement_ast(Rule::ExpressionStatement, "foo();");
    match &statement.node {
        Statement::Expression(expr_stmt) => {
            match &expr_stmt.node.expression.node {
                pecan_analysis::syntax::Expression::Call(call) => {
                    assert!(matches!(call.node.callee.node, pecan_analysis::syntax::Expression::Path(_)));
                }
                _ => panic!("expected call expression"),
            }
        }
        _ => panic!("expected expression statement"),
    }
}

#[test]
fn parses_block_ast() {
    let pair = parse_pair(Rule::Block, "{ return 1; break; }");
    let block = Block::parse(pair).expect("expected block");
    assert_eq!(block.node.statements.len(), 2);
    assert!(matches!(block.node.statements[0].node, Statement::Return(_)));
    assert!(matches!(block.node.statements[1].node, Statement::Break(_)));
}
