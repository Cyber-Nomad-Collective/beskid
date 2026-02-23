use crate::parsing::util::{assert_parse, assert_parse_fail};
use pecan_analysis::Rule;

#[test]
fn parses_item_rule() {
    assert_parse(Rule::Item, "unit main() { return; }");
}

#[test]
fn rejects_item_rule() {
    assert_parse_fail(Rule::Item, "main");
}
