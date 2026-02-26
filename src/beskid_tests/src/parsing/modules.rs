use crate::parsing::util::{assert_parse, assert_parse_fail};
use beskid_analysis::Rule;

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

#[test]
fn rejects_use_without_semicolon() {
    assert_parse_fail(Rule::UseDeclaration, "use net.http.Client");
}

#[test]
fn parses_path() {
    assert_parse(Rule::Path, "net.http.Client");
}

#[test]
fn rejects_path_with_leading_dot() {
    assert_parse_fail(Rule::Path, ".net");
}

#[test]
fn parses_visibility() {
    assert_parse(Rule::Visibility, "pub");
}

#[test]
fn rejects_invalid_visibility() {
    assert_parse_fail(Rule::Visibility, "priv");
}
