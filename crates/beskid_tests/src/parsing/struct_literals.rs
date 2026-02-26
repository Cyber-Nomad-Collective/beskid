use crate::parsing::util::{assert_parse, assert_parse_fail};
use beskid_analysis::Rule;

#[test]
fn parses_struct_literal_expression() {
    let input = "User { name: \"Ada\", age: 37 }";
    assert_parse(Rule::StructLiteralExpression, input);
}

#[test]
fn rejects_struct_literal_without_fields() {
    assert_parse_fail(Rule::StructLiteralExpression, "User { name \"Ada\" }" );
}

#[test]
fn rejects_struct_literal_without_comma_between_fields() {
    assert_parse_fail(Rule::StructLiteralExpression, "User { name: \"Ada\" age: 37 }");
}

#[test]
fn parses_field_value_list() {
    assert_parse(Rule::FieldValueList, "name: \"Ada\", age: 37");
}

#[test]
fn rejects_field_value_list_without_colon() {
    assert_parse_fail(Rule::FieldValueList, "name \"Ada\"");
}

#[test]
fn parses_field_value() {
    assert_parse(Rule::FieldValue, "name: 1");
}

#[test]
fn rejects_field_value_without_colon() {
    assert_parse_fail(Rule::FieldValue, "name 1");
}
