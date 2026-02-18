use crate::parsing::util::{assert_parse, assert_parse_fail};
use pecan_analysis::Rule;

#[test]
fn parses_identifier() {
    assert_parse(Rule::Identifier, "user_id");
}

#[test]
fn rejects_keyword_as_identifier() {
    assert_parse_fail(Rule::Identifier, "fn");
}

#[test]
fn parses_line_comment_as_whitespace() {
    assert_parse(Rule::Program, "// comment\nfn main() -> unit { return; }");
}

#[test]
fn parses_block_comment_as_whitespace() {
    assert_parse(Rule::Program, "/* comment */ fn main() -> unit { return; }");
}
