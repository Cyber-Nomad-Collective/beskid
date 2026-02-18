use crate::parsing::util::{assert_parse, assert_parse_fail};
use pecan_analysis::Rule;

#[test]
fn parses_type_definition() {
    let input = "type User { name: string, age: i32 }";
    assert_parse(Rule::TypeDefinition, input);
}

#[test]
fn parses_enum_type_path() {
    assert_parse(Rule::EnumPath, "Option::Some");
}

#[test]
fn parses_array_type() {
    assert_parse(Rule::PecanType, "i32[]");
}

#[test]
fn parses_ref_type() {
    assert_parse(Rule::PecanType, "ref string");
}

#[test]
fn rejects_invalid_type() {
    assert_parse_fail(Rule::PecanType, "ref");
}
