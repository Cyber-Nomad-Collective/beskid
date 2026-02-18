use crate::parsing::util::{assert_parse, assert_parse_fail};
use pecan_analysis::Rule;

#[test]
fn parses_function_definition() {
    let input = "fn add(a: i32, b: i32) -> i32 { return a + b; }";
    assert_parse(Rule::FunctionDefinition, input);
}

#[test]
fn parses_generic_function_definition() {
    let input = "fn id<T>(x: T) -> T { return x; }";
    assert_parse(Rule::FunctionDefinition, input);
}

#[test]
fn rejects_function_without_body() {
    assert_parse_fail(Rule::FunctionDefinition, "fn bad() -> i32;");
}
