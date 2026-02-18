use crate::parsing::util::{assert_parse, assert_parse_fail};
use pecan_analysis::Rule;

#[test]
fn parses_enum_definition() {
    let input = "enum Shape { Circle(radius: f64), Rect(width: f64, height: f64), Point }";
    assert_parse(Rule::EnumDefinition, input);
}

#[test]
fn parses_enum_constructor() {
    assert_parse(Rule::EnumConstructorExpression, "Shape::Circle(1.0)");
}

#[test]
fn rejects_unqualified_enum_constructor() {
    assert_parse_fail(Rule::EnumConstructorExpression, "Circle(1.0)");
}
