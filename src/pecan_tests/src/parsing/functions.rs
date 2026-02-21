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
fn parses_generic_parameters() {
    assert_parse(Rule::GenericParameters, "<T, U>");
}

#[test]
fn rejects_empty_generic_parameters() {
    assert_parse_fail(Rule::GenericParameters, "<>");
}

#[test]
fn parses_parameter_list() {
    assert_parse(Rule::ParameterList, "a: i32, b: string");
}

#[test]
fn rejects_parameter_list_without_colon() {
    assert_parse_fail(Rule::ParameterList, "a i32");
}

#[test]
fn rejects_function_without_body() {
    assert_parse_fail(Rule::FunctionDefinition, "fn bad() -> i32;");
}

#[test]
fn rejects_parameter_without_type() {
    assert_parse_fail(Rule::FunctionDefinition, "fn bad(x) { return x; }");
}

#[test]
fn parses_return_type() {
    assert_parse(Rule::ReturnType, "-> i32");
}

#[test]
fn rejects_return_type_without_arrow() {
    assert_parse_fail(Rule::ReturnType, "i32");
}

#[test]
fn parses_parameter_modifier() {
    assert_parse(Rule::ParameterModifier, "ref");
}

#[test]
fn rejects_invalid_parameter_modifier() {
    assert_parse_fail(Rule::ParameterModifier, "mut");
}

#[test]
fn parses_parameter() {
    assert_parse(Rule::Parameter, "out value: i32");
}

#[test]
fn rejects_parameter_without_colon() {
    assert_parse_fail(Rule::Parameter, "value i32");
}

#[test]
fn parses_receiver_type() {
    assert_parse(Rule::ReceiverType, "Point<T>");
}

#[test]
fn rejects_receiver_type_without_name() {
    assert_parse_fail(Rule::ReceiverType, "<T>");
}
