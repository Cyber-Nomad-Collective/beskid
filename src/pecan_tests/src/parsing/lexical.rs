use crate::parsing::util::{assert_parse, assert_parse_fail};
use pecan_analysis::Rule;

#[test]
fn parses_identifier() {
    assert_parse(Rule::Identifier, "user_id");
}

#[test]
fn rejects_keyword_as_identifier() {
    assert_parse_fail(Rule::Identifier, "type");
}

#[test]
fn rejects_identifier_starting_with_digit() {
    assert_parse_fail(Rule::Identifier, "1abc");
}

#[test]
fn parses_line_comment_as_whitespace() {
    assert_parse(Rule::Program, "// comment\nunit main() { return; }");
}

#[test]
fn parses_block_comment_as_whitespace() {
    assert_parse(Rule::Program, "/* comment */ unit main() { return; }");
}

#[test]
fn rejects_program_with_trailing_tokens() {
    assert_parse_fail(Rule::Program, "unit main() { return; } extra");
}
