use crate::parsing::util::{assert_parse, assert_parse_fail};
use beskid_analysis::Rule;

#[test]
fn parses_integer_literal() {
    assert_parse(Rule::IntegerLiteral, "42");
}

#[test]
fn parses_float_literal() {
    assert_parse(Rule::FloatLiteral, "3.14");
}

#[test]
fn parses_string_literal() {
    assert_parse(Rule::StringLiteral, "\"hello\"");
}

#[test]
fn parses_string_interpolation() {
    assert_parse(Rule::StringLiteral, "\"hi ${name}\"");
}

#[test]
fn parses_char_literal() {
    assert_parse(Rule::CharLiteral, "'a'");
}

#[test]
fn rejects_unterminated_string() {
    assert_parse_fail(Rule::StringLiteral, "\"unterminated");
}

#[test]
fn rejects_empty_char_literal() {
    assert_parse_fail(Rule::CharLiteral, "''");
}

#[test]
fn rejects_malformed_float_literal() {
    assert_parse_fail(Rule::FloatLiteral, "3.");
}
