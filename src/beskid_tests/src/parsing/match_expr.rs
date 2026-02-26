use crate::parsing::util::{assert_parse, assert_parse_fail};
use beskid_analysis::Rule;

#[test]
fn parses_match_expression() {
    let input = "match x { Foo::Bar => 1, _ => 0, }";
    assert_parse(Rule::MatchExpression, input);
}

#[test]
fn parses_match_expression_without_trailing_comma() {
    let input = "match x { Foo::Bar => 1, _ => 0 }";
    assert_parse(Rule::MatchExpression, input);
}

#[test]
fn parses_match_with_guard() {
    let input = "match x { Foo::Bar when x > 0 => 1, _ => 0, }";
    assert_parse(Rule::MatchExpression, input);
}

#[test]
fn rejects_match_arm_without_comma() {
    let input = "match x { Foo::Bar => 1 _ => 0 }";
    assert_parse_fail(Rule::MatchExpression, input);
}

#[test]
fn rejects_match_arm_without_arrow() {
    let input = "match x { Foo::Bar 1, }";
    assert_parse_fail(Rule::MatchExpression, input);
}

#[test]
fn parses_match_guard() {
    assert_parse(Rule::MatchGuard, "when x > 0");
}

#[test]
fn rejects_match_guard_without_expression() {
    assert_parse_fail(Rule::MatchGuard, "when");
}

#[test]
fn parses_match_arm() {
    assert_parse(Rule::MatchArm, "Foo::Bar => 1");
}

#[test]
fn rejects_match_arm_without_pattern() {
    assert_parse_fail(Rule::MatchArm, "=> 1,");
}
