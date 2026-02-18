use pecan_analysis::{PecanParser, Rule};
use pest::iterators::Pair;
use pest::Parser;

pub fn assert_parse(rule: Rule, input: &str) {
    let result = PecanParser::parse(rule, input);
    assert!(result.is_ok(), "expected parse success for rule {rule:?} on input: {input}\n{result:?}");
}

pub fn assert_parse_fail(rule: Rule, input: &str) {
    let result = PecanParser::parse(rule, input);
    assert!(result.is_err(), "expected parse failure for rule {rule:?} on input: {input}");
}

pub fn parse_pair(rule: Rule, input: &str) -> Pair<Rule> {
    let mut pairs = PecanParser::parse(rule, input)
        .unwrap_or_else(|error| panic!("expected parse success for rule {rule:?} on input: {input}\n{error}"));
    let pair = pairs.next().expect("expected a parse pair");
    assert!(pairs.next().is_none(), "expected a single top-level pair for rule {rule:?}");
    pair
}

pub fn assert_inner_rules(pair: &Pair<Rule>, expected: &[Rule]) {
    let rules: Vec<Rule> = pair.clone().into_inner().map(|inner| inner.as_rule()).collect();
    assert_eq!(rules, expected, "unexpected inner rules for {rule:?}", rule = pair.as_rule());
}

pub fn assert_expression_is_identifier(expr: &Pair<Rule>, expected: &str) {
    let assignment = expect_single_inner(expr, Rule::AssignmentExpression);
    let logical_or = expect_single_inner(&assignment, Rule::LogicalOrExpression);
    let logical_and = expect_single_inner(&logical_or, Rule::LogicalAndExpression);
    let equality = expect_single_inner(&logical_and, Rule::EqualityExpression);
    let comparison = expect_single_inner(&equality, Rule::ComparisonExpression);
    let addition = expect_single_inner(&comparison, Rule::AdditionExpression);
    let multiplication = expect_single_inner(&addition, Rule::MultiplicationExpression);
    let unary = expect_single_inner(&multiplication, Rule::UnaryExpression);
    let postfix = expect_single_inner(&unary, Rule::PostfixExpression);
    let primary = expect_single_inner(&postfix, Rule::PrimaryExpression);
    let path = expect_single_inner(&primary, Rule::Path);
    let mut identifiers = path.into_inner();
    let identifier = identifiers.next().expect("expected identifier in path");
    assert_eq!(identifier.as_rule(), Rule::Identifier);
    assert!(identifiers.next().is_none(), "expected single identifier path");
    assert_eq!(identifier.as_str(), expected);
}

pub fn assert_expression_is_integer(expr: &Pair<Rule>, expected: &str) {
    let assignment = expect_single_inner(expr, Rule::AssignmentExpression);
    let logical_or = expect_single_inner(&assignment, Rule::LogicalOrExpression);
    let logical_and = expect_single_inner(&logical_or, Rule::LogicalAndExpression);
    let equality = expect_single_inner(&logical_and, Rule::EqualityExpression);
    let comparison = expect_single_inner(&equality, Rule::ComparisonExpression);
    let addition = expect_single_inner(&comparison, Rule::AdditionExpression);
    let multiplication = expect_single_inner(&addition, Rule::MultiplicationExpression);
    let unary = expect_single_inner(&multiplication, Rule::UnaryExpression);
    let postfix = expect_single_inner(&unary, Rule::PostfixExpression);
    let primary = expect_single_inner(&postfix, Rule::PrimaryExpression);
    let literal = expect_single_inner(&primary, Rule::Literal);
    let integer = expect_single_inner(&literal, Rule::IntegerLiteral);
    assert_eq!(integer.as_str(), expected);
}

fn expect_single_inner(pair: &Pair<Rule>, expected_rule: Rule) -> Pair<Rule> {
    let mut inner = pair.clone().into_inner();
    let child = inner.next().unwrap_or_else(|| panic!("expected inner rule {expected_rule:?} in {rule:?}", rule = pair.as_rule()));
    assert_eq!(child.as_rule(), expected_rule, "unexpected inner rule for {rule:?}", rule = pair.as_rule());
    assert!(inner.next().is_none(), "expected single inner rule {expected_rule:?} in {rule:?}", rule = pair.as_rule());
    child
}
