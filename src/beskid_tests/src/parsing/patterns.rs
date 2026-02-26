use crate::parsing::util::{assert_parse, assert_parse_fail};
use beskid_analysis::Rule;

#[test]
fn parses_pattern_list() {
    assert_parse(Rule::PatternList, "_, Foo::Bar, 1");
}

#[test]
fn rejects_pattern_list_starting_with_comma() {
    assert_parse_fail(Rule::PatternList, ", _");
}

#[test]
fn parses_enum_pattern() {
    assert_parse(Rule::EnumPattern, "Option::Some(1, _)");
}

#[test]
fn rejects_enum_pattern_without_variant() {
    assert_parse_fail(Rule::EnumPattern, "Option::");
}

#[test]
fn parses_pattern_rule() {
    assert_parse(Rule::Pattern, "_");
}

#[test]
fn rejects_pattern_rule_invalid_start() {
    assert_parse_fail(Rule::Pattern, ",");
}
