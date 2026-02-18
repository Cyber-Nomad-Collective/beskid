use crate::parsing::util::{assert_parse, assert_parse_fail};
use pecan_analysis::Rule;

#[test]
fn parses_arithmetic_precedence() {
    assert_parse(Rule::Expression, "1 + 2 * 3");
}

#[test]
fn parses_assignment_expression() {
    assert_parse(Rule::Expression, "x = y + 1");
}

#[test]
fn parses_calls_and_member_access() {
    assert_parse(Rule::Expression, "foo.bar(1, 2)");
}

#[test]
fn rejects_empty_expression() {
    assert_parse_fail(Rule::Expression, "");
}
