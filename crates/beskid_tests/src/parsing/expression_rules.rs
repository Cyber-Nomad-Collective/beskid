use crate::parsing::util::{assert_parse, assert_parse_fail};
use beskid_analysis::Rule;

#[test]
fn parses_assignment_expression_rule() {
    assert_parse(Rule::AssignmentExpression, "x = 1");
}

#[test]
fn rejects_assignment_expression_without_target() {
    assert_parse_fail(Rule::AssignmentExpression, "= 1");
}

#[test]
fn parses_logical_or_expression_rule() {
    assert_parse(Rule::LogicalOrExpression, "true || false");
}

#[test]
fn rejects_logical_or_expression_without_operands() {
    assert_parse_fail(Rule::LogicalOrExpression, "||");
}

#[test]
fn parses_logical_and_expression_rule() {
    assert_parse(Rule::LogicalAndExpression, "true && false");
}

#[test]
fn rejects_logical_and_expression_without_operands() {
    assert_parse_fail(Rule::LogicalAndExpression, "&&");
}

#[test]
fn parses_equality_expression_rule() {
    assert_parse(Rule::EqualityExpression, "1 == 2");
}

#[test]
fn rejects_equality_expression_without_operands() {
    assert_parse_fail(Rule::EqualityExpression, "==");
}

#[test]
fn parses_comparison_expression_rule() {
    assert_parse(Rule::ComparisonExpression, "1 < 2");
}

#[test]
fn rejects_comparison_expression_without_operands() {
    assert_parse_fail(Rule::ComparisonExpression, "<");
}

#[test]
fn parses_addition_expression_rule() {
    assert_parse(Rule::AdditionExpression, "1 + 2");
}

#[test]
fn rejects_addition_expression_without_operands() {
    assert_parse_fail(Rule::AdditionExpression, "+");
}

#[test]
fn parses_multiplication_expression_rule() {
    assert_parse(Rule::MultiplicationExpression, "2 * 3");
}

#[test]
fn rejects_multiplication_expression_without_operands() {
    assert_parse_fail(Rule::MultiplicationExpression, "*");
}

#[test]
fn parses_unary_expression_rule() {
    assert_parse(Rule::UnaryExpression, "-1");
}

#[test]
fn rejects_unary_expression_without_operand() {
    assert_parse_fail(Rule::UnaryExpression, "!");
}

#[test]
fn parses_postfix_expression_rule() {
    assert_parse(Rule::PostfixExpression, "foo(1).bar");
}

#[test]
fn rejects_postfix_expression_with_invalid_prefix() {
    assert_parse_fail(Rule::PostfixExpression, ".foo");
}

#[test]
fn parses_primary_expression_rule() {
    assert_parse(Rule::PrimaryExpression, "foo");
}

#[test]
fn rejects_primary_expression_without_value() {
    assert_parse_fail(Rule::PrimaryExpression, ")");
}

#[test]
fn parses_call_expression_rule() {
    assert_parse(Rule::CallExpression, "foo(1)");
}

#[test]
fn rejects_call_expression_without_paren() {
    assert_parse_fail(Rule::CallExpression, "foo");
}

#[test]
fn parses_call_operator_rule() {
    assert_parse(Rule::CallOperator, "(1, 2)");
}

#[test]
fn rejects_call_operator_without_closing_paren() {
    assert_parse_fail(Rule::CallOperator, "(1, 2");
}

#[test]
fn parses_member_access_rule() {
    assert_parse(Rule::MemberAccess, ".field");
}

#[test]
fn rejects_member_access_without_name() {
    assert_parse_fail(Rule::MemberAccess, ".");
}

#[test]
fn parses_grouped_expression_rule() {
    assert_parse(Rule::GroupedExpression, "(1)");
}

#[test]
fn rejects_grouped_expression_without_closing_paren() {
    assert_parse_fail(Rule::GroupedExpression, "(1");
}

#[test]
fn parses_block_expression_rule() {
    assert_parse(Rule::BlockExpression, "{ return 1; }");
}

#[test]
fn rejects_block_expression_without_closing_brace() {
    assert_parse_fail(Rule::BlockExpression, "{ return 1;");
}
