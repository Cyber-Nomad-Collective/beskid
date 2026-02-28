use crate::parsing::util::{assert_parse, assert_parse_fail};
use beskid_analysis::Rule;

#[test]
fn parses_literal_rule() {
    assert_parse(Rule::Literal, "true");
}

#[test]
fn rejects_literal_rule() {
    assert_parse_fail(Rule::Literal, "truth");
}

#[test]
fn parses_string_content() {
    assert_parse(Rule::StringContent, "hello");
}

#[test]
fn rejects_string_content_with_quote() {
    assert_parse_fail(Rule::StringContent, "\"");
}

#[test]
fn parses_string_interpolation_rule() {
    assert_parse(Rule::StringInterpolation, "${name}");
}

#[test]
fn parses_string_interpolation_rule_with_full_expression() {
    assert_parse(Rule::StringInterpolation, "${1 + 2}");
}

#[test]
fn rejects_string_interpolation_without_expr() {
    assert_parse_fail(Rule::StringInterpolation, "${}");
}

#[test]
fn parses_string_escape_rule() {
    assert_parse(Rule::StringEscape, "\\\"");
}

#[test]
fn rejects_string_escape_rule() {
    assert_parse_fail(Rule::StringEscape, "\\n");
}

#[test]
fn parses_string_text_rule() {
    assert_parse(Rule::StringText, "hello");
}

#[test]
fn rejects_string_text_with_quote() {
    assert_parse_fail(Rule::StringText, "\"");
}
