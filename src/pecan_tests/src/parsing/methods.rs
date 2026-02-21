use crate::parsing::util::{assert_parse, assert_parse_fail};
use pecan_analysis::Rule;

#[test]
fn parses_method_definition() {
    let input = "fn Point.len(self: Point) -> i32 { return 0; }";
    assert_parse(Rule::MethodDefinition, input);
}

#[test]
fn rejects_method_without_receiver_type() {
    assert_parse_fail(Rule::MethodDefinition, "fn len(self: Point) -> i32 { return 0; }");
}

#[test]
fn rejects_method_without_dot() {
    assert_parse_fail(Rule::MethodDefinition, "fn Point len(self: Point) -> i32 { return 0; }");
}
