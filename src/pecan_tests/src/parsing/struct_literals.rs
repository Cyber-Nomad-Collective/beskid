use crate::parsing::util::{assert_parse, assert_parse_fail};
use pecan_analysis::Rule;

#[test]
fn parses_struct_literal_expression() {
    let input = "User { name: \"Ada\", age: 37 }";
    assert_parse(Rule::StructLiteralExpression, input);
}

#[test]
fn rejects_struct_literal_without_fields() {
    assert_parse_fail(Rule::StructLiteralExpression, "User { name \"Ada\" }" );
}
