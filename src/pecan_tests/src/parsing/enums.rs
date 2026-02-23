use crate::parsing::util::{assert_parse, assert_parse_fail};
use pecan_analysis::Rule;

#[test]
fn parses_enum_definition() {
    let input = "enum Shape { Circle(f64 radius), Rect(f64 width, f64 height), Point }";
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
    let input = "enum Shape { Circle(f64 radius) Rect(f64 width) }";
    assert_parse_fail(Rule::EnumDefinition, input);
}

#[test]
fn rejects_enum_constructor_without_closing_paren() {
    assert_parse_fail(Rule::EnumConstructorExpression, "Shape::Circle(1.0");
}

#[test]
fn parses_enum_variant_list() {
    assert_parse(Rule::EnumVariantList, "Circle(f64 radius), Point");
}

#[test]
fn rejects_enum_variant_list_starting_with_comma() {
    assert_parse_fail(Rule::EnumVariantList, ", Circle");
}

#[test]
fn parses_enum_variant() {
    assert_parse(Rule::EnumVariant, "Circle(f64 radius)");
}

#[test]
fn rejects_enum_variant_without_name() {
    assert_parse_fail(Rule::EnumVariant, "(f64)");
}
