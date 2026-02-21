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

#[test]
fn rejects_enum_definition_without_comma() {
    let input = "enum Shape { Circle(radius: f64) Rect(width: f64) }";
    assert_parse_fail(Rule::EnumDefinition, input);
}

#[test]
fn rejects_enum_constructor_without_closing_paren() {
    assert_parse_fail(Rule::EnumConstructorExpression, "Shape::Circle(1.0");
}

#[test]
fn parses_enum_variant_list() {
    assert_parse(Rule::EnumVariantList, "Circle(radius: f64), Point");
}

#[test]
fn rejects_enum_variant_list_starting_with_comma() {
    assert_parse_fail(Rule::EnumVariantList, ", Circle");
}

#[test]
fn parses_enum_variant() {
    assert_parse(Rule::EnumVariant, "Circle(radius: f64)");
}

#[test]
fn rejects_enum_variant_without_name() {
    assert_parse_fail(Rule::EnumVariant, "(radius: f64)");
}
