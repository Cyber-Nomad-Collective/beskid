use crate::parsing::util::{assert_parse, assert_parse_fail};
use pecan_analysis::Rule;

#[test]
fn parses_method_definition() {
    let input = "i32 Point.len(self: Point) { return 0; }";
    assert_parse(Rule::MethodDefinition, input);
}

#[test]
fn rejects_method_without_receiver_type() {
    assert_parse_fail(Rule::MethodDefinition, "i32 len(self: Point) { return 0; }");
}

#[test]
fn rejects_method_without_dot() {
    assert_parse_fail(Rule::MethodDefinition, "i32 Point len(self: Point) { return 0; }");
}
