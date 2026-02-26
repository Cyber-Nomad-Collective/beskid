use crate::parser::Rule;
use crate::parsing::error::ParseError;
use crate::parsing::parsable::Parsable;
use crate::syntax::expressions::span::{span_from_bounds, span_from_range};
use crate::syntax::{Expression, SpanInfo, Spanned};
use pest::iterators::Pair;

use beskid_ast_derive::AstNode;

#[derive(AstNode, Debug, Clone, PartialEq, Eq)]
pub struct BinaryExpression {
    #[ast(child)]
    pub left: Box<Spanned<Expression>>,
    #[ast(child)]
    pub op: Spanned<BinaryOp>,
    #[ast(child)]
    pub right: Box<Spanned<Expression>>,
}

#[derive(AstNode, Debug, Clone, Copy, PartialEq, Eq)]
pub enum BinaryOp {
    Or,
    And,
    Eq,
    NotEq,
    Lt,
    Lte,
    Gt,
    Gte,
    Add,
    Sub,
    Mul,
    Div,
}

pub(crate) fn parse_binary_expression(pair: Pair<Rule>) -> Result<Spanned<Expression>, ParseError> {
    match pair.as_rule() {
        Rule::LogicalOrExpression => parse_chain(pair, &["||"]),
        Rule::LogicalAndExpression => parse_chain(pair, &["&&"]),
        Rule::EqualityExpression => parse_chain(pair, &["==", "!="]),
        Rule::ComparisonExpression => parse_chain(pair, &["<", "<=", ">", ">="]),
        Rule::AdditionExpression => parse_chain(pair, &["+", "-"]),
        Rule::MultiplicationExpression => parse_chain(pair, &["*", "/"]),
        _ => Err(ParseError::unexpected_rule(pair, None)),
    }
}

fn parse_chain(pair: Pair<Rule>, operators: &[&str]) -> Result<Spanned<Expression>, ParseError> {
    let span = SpanInfo::from_span(&pair.as_span());
    let input = pair.as_span().get_input();
    let mut expressions = pair
        .into_inner()
        .map(Expression::parse)
        .collect::<Result<Vec<_>, _>>()?
        .into_iter();

    let mut expr = expressions
        .next()
        .ok_or(ParseError::missing(Rule::Expression))?;

    for next in expressions {
        let op_text = extract_operator(input, &expr.span, &next.span, operators)
            .ok_or(ParseError::missing(Rule::Expression))?;
        let op_span = span_from_range(input, expr.span.end, next.span.start, op_text)
            .ok_or(ParseError::missing(Rule::Expression))?;
        let op = Spanned::new(map_binary_op(op_text)?, op_span);
        let node_span = span_from_bounds(input, expr.span.start, next.span.end)
            .ok_or(ParseError::missing(Rule::Expression))?;
        let binary = Spanned::new(
            BinaryExpression {
                left: Box::new(expr),
                op,
                right: Box::new(next),
            },
            node_span,
        );
        expr = Spanned::new(Expression::Binary(binary), node_span);
    }

    Ok(Spanned::new(expr.node, span))
}

fn map_binary_op(op_text: &str) -> Result<BinaryOp, ParseError> {
    match op_text {
        "||" => Ok(BinaryOp::Or),
        "&&" => Ok(BinaryOp::And),
        "==" => Ok(BinaryOp::Eq),
        "!=" => Ok(BinaryOp::NotEq),
        "<" => Ok(BinaryOp::Lt),
        "<=" => Ok(BinaryOp::Lte),
        ">" => Ok(BinaryOp::Gt),
        ">=" => Ok(BinaryOp::Gte),
        "+" => Ok(BinaryOp::Add),
        "-" => Ok(BinaryOp::Sub),
        "*" => Ok(BinaryOp::Mul),
        "/" => Ok(BinaryOp::Div),
        _ => Err(ParseError::missing(Rule::Expression)),
    }
}

fn extract_operator<'a>(
    input: &'a str,
    left: &SpanInfo,
    right: &SpanInfo,
    operators: &[&'a str],
) -> Option<&'a str> {
    let between = input.get(left.end..right.start)?.trim();
    operators.iter().find(|op| between.contains(**op)).copied()
}
