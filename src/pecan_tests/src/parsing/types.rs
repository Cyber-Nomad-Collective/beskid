use crate::parsing::util::{assert_parse, assert_parse_fail};
use pecan_analysis::Rule;

#[test]
fn parses_type_definition() {
    let input = "type User { string name, i32 age }";
    assert_parse(Rule::TypeDefinition, input);
}

#[test]
fn parses_field_list() {
    assert_parse(Rule::FieldList, "string name, i32 age");
}

#[test]
fn rejects_field_list_without_colon() {
    assert_parse_fail(Rule::FieldList, "name: string");
}

#[test]
fn parses_enum_type_path() {
    assert_parse(Rule::EnumPath, "Option::Some");
}

#[test]
fn rejects_enum_type_path_without_variant() {
    assert_parse_fail(Rule::EnumPath, "Option:");
}

#[test]
fn parses_primitive_type() {
    assert_parse(Rule::PrimitiveType, "i32");
}

#[test]
fn rejects_invalid_primitive_type() {
    assert_parse_fail(Rule::PrimitiveType, "i128");
}

#[test]
fn parses_type_name_with_generics() {
    assert_parse(Rule::TypeName, "Option<string>");
}

#[test]
fn rejects_generic_arguments_with_trailing_comma() {
    assert_parse_fail(Rule::GenericArguments, "<i32,>");
}

#[test]
fn parses_generic_arguments() {
    assert_parse(Rule::GenericArguments, "<i32, string>");
}

#[test]
fn rejects_empty_generic_arguments() {
    assert_parse_fail(Rule::GenericArguments, "<>");
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

#[test]
fn rejects_field_without_type() {
    assert_parse_fail(Rule::FieldList, "name");
}

#[test]
fn parses_field() {
    assert_parse(Rule::Field, "string name");
}

#[test]
fn rejects_field_without_colon() {
    assert_parse_fail(Rule::Field, "name: string");
}
