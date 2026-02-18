use crate::parsing::util::{assert_parse, assert_parse_fail};
use pecan_analysis::Rule;

#[test]
fn parses_if_else_statement() {
    assert_parse(Rule::IfStatement, "if cond { return 1; } else { return 2; }");
}

#[test]
fn parses_while_statement() {
    assert_parse(Rule::WhileStatement, "while cond { break; }");
}

#[test]
fn parses_for_statement() {
    assert_parse(Rule::ForStatement, "for i in range(0, 10) { continue; }");
}

#[test]
fn rejects_for_without_range() {
    assert_parse_fail(Rule::ForStatement, "for i in items { };");
}
