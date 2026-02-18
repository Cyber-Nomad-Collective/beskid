use crate::parsing::util::{assert_parse, assert_parse_fail};
use pecan_analysis::Rule;

#[test]
fn parses_match_expression() {
    let input = "match x { Foo::Bar => 1, _ => 0, }";
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
