use crate::parsing::util::{assert_parse, assert_parse_fail};
use beskid_analysis::Rule;

#[test]
fn parses_attribute_declaration() {
    assert_parse(
        Rule::AttributeDeclaration,
        "attribute Builder { suffix: string = \"Factory\", enabled: bool = true }",
    );
}

#[test]
fn parses_public_attribute_declaration() {
    assert_parse(
        Rule::AttributeDeclaration,
        "pub attribute Extern { Abi: string, Library: string = \"libc\" }",
    );
}

#[test]
fn parses_attribute_declaration_with_targets() {
    assert_parse(
        Rule::AttributeDeclaration,
        "attribute Builder(TypeDeclaration, MethodDeclaration) { suffix: string = \"Factory\" }",
    );
}

#[test]
fn parses_attribute_application_with_typed_argument_values() {
    assert_parse(
        Rule::ContractDefinition,
        "[Extern(Abi: \"C\", Enabled: true)] contract Reader { unit read(); }",
    );
}

#[test]
fn rejects_attribute_declaration_without_body() {
    assert_parse_fail(Rule::AttributeDeclaration, "attribute Empty;");
}
