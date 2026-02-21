use crate::parsing::util::{assert_parse, assert_parse_fail};
use pecan_analysis::Rule;

#[test]
fn parses_contract_definition() {
    let input = "contract Reader { read(p: u8[]) -> i32; }";
    assert_parse(Rule::ContractDefinition, input);
}

#[test]
fn parses_contract_embedding() {
    let input = "contract ReadWriter { Reader; Writer; }";
    assert_parse(Rule::ContractDefinition, input);
}

#[test]
fn rejects_contract_without_body() {
    assert_parse_fail(Rule::ContractDefinition, "contract Empty;");
}

#[test]
fn rejects_contract_method_without_semicolon() {
    let input = "contract Reader { read(p: u8[]) -> i32 }";
    assert_parse_fail(Rule::ContractDefinition, input);
}

#[test]
fn parses_contract_item_method() {
    assert_parse(Rule::ContractItem, "read(p: u8[]) -> i32;");
}

#[test]
fn rejects_contract_item_without_name() {
    assert_parse_fail(Rule::ContractItem, "(p: u8[]) -> i32;");
}

#[test]
fn parses_contract_embedding_item() {
    assert_parse(Rule::ContractEmbedding, "Reader;");
}

#[test]
fn rejects_contract_embedding_without_name() {
    assert_parse_fail(Rule::ContractEmbedding, ";");
}

#[test]
fn parses_contract_method_signature() {
    assert_parse(Rule::ContractMethodSignature, "read(p: u8[]) -> i32;");
}

#[test]
fn rejects_contract_method_signature_without_semicolon() {
    assert_parse_fail(Rule::ContractMethodSignature, "read(p: u8[]) -> i32");
}
