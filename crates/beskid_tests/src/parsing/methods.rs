use crate::parsing::util::{assert_parse, assert_parse_fail};
use beskid_analysis::parsing::parsable::Parsable;
use beskid_analysis::Rule;

#[test]
fn parses_method_definition() {
    let input = "impl Point { i32 len() { return 0; } }";
    assert_parse(Rule::ImplBlock, input);
}

#[test]
fn rejects_legacy_receiver_qualified_method_syntax() {
    assert_parse_fail(Rule::Program, "i32 Point.len(self: Point) { return 0; }");
}

#[test]
fn parses_impl_method_member_signature_shape() {
    assert_parse(Rule::ImplMethodDefinition, "i32 len(i64 value) { return value; }");
}

#[test]
fn rejects_explicit_self_parameter_in_impl_method() {
    let pair = crate::parsing::util::parse_pair(
        Rule::Program,
        "impl Point { i32 len(self: Point) { return 0; } }",
    );
    let parsed = beskid_analysis::syntax::Program::parse(pair);
    assert!(
        parsed.is_err(),
        "expected explicit self parameter in impl method to be rejected"
    );
}
