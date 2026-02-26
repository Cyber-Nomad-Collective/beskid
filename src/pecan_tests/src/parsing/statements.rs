use crate::parsing::util::{assert_parse, assert_parse_fail};
use pecan_analysis::Rule;

#[test]
fn parses_let_statement() {
    assert_parse(Rule::LetStatement, "i32 mut age = 42;");
    assert_parse(Rule::LetStatement, "i32 age = 42;");
    assert_parse(Rule::LetStatement, "let age = 42;");
}

#[test]
fn rejects_let_without_semicolon() {
    assert_parse_fail(Rule::LetStatement, "let age = 42");
}

#[test]
fn rejects_let_without_equals() {
    assert_parse_fail(Rule::LetStatement, "let age 42;");
}

#[test]
fn rejects_let_with_mut_keyword() {
    assert_parse_fail(Rule::LetStatement, "let mut age = 42;");
}

#[test]
fn rejects_let_with_type_annotation() {
    assert_parse_fail(Rule::LetStatement, "let age: i32 = 42;");
}

#[test]
fn parses_return_statement() {
    assert_parse(Rule::ReturnStatement, "return 1;");
}

#[test]
fn rejects_return_without_semicolon() {
    assert_parse_fail(Rule::ReturnStatement, "return 1");
}

#[test]
fn parses_break_statement() {
    assert_parse(Rule::BreakStatement, "break;");
}

#[test]
fn rejects_break_without_semicolon() {
    assert_parse_fail(Rule::BreakStatement, "break");
}

#[test]
fn parses_continue_statement() {
    assert_parse(Rule::ContinueStatement, "continue;");
}

#[test]
fn rejects_continue_without_semicolon() {
    assert_parse_fail(Rule::ContinueStatement, "continue");
}

#[test]
fn parses_expression_statement() {
    assert_parse(Rule::ExpressionStatement, "foo();");
}

#[test]
fn rejects_expression_statement_without_semicolon() {
    assert_parse_fail(Rule::ExpressionStatement, "foo()");
}

#[test]
fn parses_block() {
    assert_parse(Rule::Block, "{ return 1; break; }");
}

#[test]
fn rejects_block_without_closing_brace() {
    assert_parse_fail(Rule::Block, "{ return 1;");
}

#[test]
fn parses_range_expression() {
    assert_parse(Rule::RangeExpression, "range(0, 10)");
}

#[test]
fn rejects_range_expression_without_comma() {
    assert_parse_fail(Rule::RangeExpression, "range(0 10)");
}

#[test]
fn parses_type_annotation() {
    assert_parse(Rule::TypeAnnotation, ": i32");
}

#[test]
fn rejects_type_annotation_without_type() {
    assert_parse_fail(Rule::TypeAnnotation, ":");
}

#[test]
fn parses_statement_rule() {
    assert_parse(Rule::Statement, "return 1;");
}

#[test]
fn rejects_statement_rule_invalid_start() {
    assert_parse_fail(Rule::Statement, "return");
}
