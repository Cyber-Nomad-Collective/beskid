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
