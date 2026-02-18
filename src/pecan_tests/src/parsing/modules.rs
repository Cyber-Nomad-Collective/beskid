use crate::parsing::util::{assert_parse, assert_parse_fail};
use pecan_analysis::Rule;

#[test]
fn parses_module_declaration() {
    assert_parse(Rule::ModuleDeclaration, "mod net.http;");
}

#[test]
fn parses_use_declaration() {
    assert_parse(Rule::UseDeclaration, "use net.http.Client;");
}

#[test]
fn parses_pub_use_declaration() {
    assert_parse(Rule::UseDeclaration, "pub use net.http.Client;");
}

#[test]
fn rejects_module_without_semicolon() {
    assert_parse_fail(Rule::ModuleDeclaration, "mod net.http");
}
