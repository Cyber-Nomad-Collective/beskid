use crate::parsing::util::{assert_parse, assert_parse_fail};
use beskid_analysis::Rule;

#[test]
fn parses_function_definition() {
    let input = "i32 add(a: i32, b: i32) { return a + b; }";
    assert_parse(Rule::FunctionDefinition, input);
}

#[test]
fn parses_generic_function_definition() {
    let input = "T id<T>(x: T) { return x; }";
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
fn parses_parameter_list_legacy_type_name_form() {
    assert_parse(Rule::ParameterList, "i32 a");
}

#[test]
fn rejects_function_without_body() {
    assert_parse_fail(Rule::FunctionDefinition, "i32 bad();");
}

#[test]
fn rejects_parameter_without_type() {
    assert_parse_fail(Rule::FunctionDefinition, "i32 bad(x) { return x; }");
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
fn parses_parameter_legacy_type_name_form() {
    assert_parse(Rule::Parameter, "i32 value");
}

#[test]
fn parses_receiver_type() {
    assert_parse(Rule::ReceiverType, "Point<T>");
}

#[test]
fn rejects_receiver_type_without_name() {
    assert_parse_fail(Rule::ReceiverType, "<T>");
}
