use pest::iterators::Pair;
use crate::parsing::error::ParseError;
use crate::parsing::parsable::Parsable;
use crate::parser::Rule;
use crate::syntax::{SpanInfo, Spanned};
use crate::syntax::expressions::span::span_from_bounds;

use super::assign_expression::AssignExpression;
use super::binary_expression::{BinaryExpression, parse_binary_expression};
use super::block_expression::parse_block_expression;
use super::call_expression::parse_call_expression;
use super::enum_constructor_expression::parse_enum_constructor_expression;
use super::grouped_expression::parse_grouped_expression;
use super::literal_expression::parse_literal_expression;
use super::match_expression::parse_match_expression;
use super::member_expression::parse_member_expression;
use super::path_expression::parse_path_expression;
use super::struct_literal_expression::parse_struct_literal_expression;
use super::unary_expression::{UnaryExpression, parse_unary_expression};

use beskid_ast_derive::AstNode;

#[derive(AstNode, Debug, Clone, PartialEq, Eq)]
pub enum Expression {
    #[ast(child)]
    Match(Spanned<super::match_expression::MatchExpression>),
    #[ast(child)]
    Assign(Spanned<AssignExpression>),
    #[ast(child)]
    Binary(Spanned<BinaryExpression>),
    #[ast(child)]
    Unary(Spanned<UnaryExpression>),
    #[ast(child)]
    Call(Spanned<super::call_expression::CallExpression>),
    #[ast(child)]
    Member(Spanned<super::member_expression::MemberExpression>),
    #[ast(child)]
    Literal(Spanned<super::literal_expression::LiteralExpression>),
    #[ast(child)]
    Path(Spanned<super::path_expression::PathExpression>),
    #[ast(child)]
    StructLiteral(Spanned<super::struct_literal_expression::StructLiteralExpression>),
    #[ast(child)]
    EnumConstructor(Spanned<super::enum_constructor_expression::EnumConstructorExpression>),
    #[ast(child)]
    Block(Spanned<super::block_expression::BlockExpression>),
    #[ast(child)]
    Grouped(Spanned<super::grouped_expression::GroupedExpression>),
}

impl Parsable for Expression {
    fn parse(pair: Pair<Rule>) -> Result<Spanned<Self>, ParseError> {
        parse_expression(pair)
    }
}

fn parse_expression(pair: Pair<Rule>) -> Result<Spanned<Expression>, ParseError> {
    let span = SpanInfo::from_span(&pair.as_span());

    match pair.as_rule() {
        Rule::Expression => {
            let inner = pair
                .into_inner()
                .next()
                .ok_or(ParseError::missing(Rule::AssignmentExpression))?;
            let inner_expr = parse_expression(inner)?;
            Ok(Spanned::new(inner_expr.node, span))
        }
        Rule::MatchExpression => parse_match_expression(pair),
        Rule::AssignmentExpression => super::assign_expression::parse_assignment_expression(pair),
        Rule::LogicalOrExpression
        | Rule::LogicalAndExpression
        | Rule::EqualityExpression
        | Rule::ComparisonExpression
        | Rule::AdditionExpression
        | Rule::MultiplicationExpression => parse_binary_expression(pair),
        Rule::UnaryExpression => parse_unary_expression(pair),
        Rule::PostfixExpression => parse_postfix_expression(pair),
        Rule::PrimaryExpression => parse_primary_expression(pair),
        Rule::GroupedExpression => parse_grouped_expression(pair),
        Rule::BlockExpression => parse_block_expression(pair),
        Rule::EnumConstructorExpression => parse_enum_constructor_expression(pair),
        Rule::StructLiteralExpression => parse_struct_literal_expression(pair),
        Rule::Literal => parse_literal_expression(pair),
        Rule::Path => parse_path_expression(pair),
        _ => Err(ParseError::unexpected_rule(pair, None)),
    }
}

pub(crate) fn parse_postfix_expression(
    pair: Pair<Rule>,
) -> Result<Spanned<Expression>, ParseError> {
    let span = SpanInfo::from_span(&pair.as_span());
    let input = pair.as_span().get_input();
    let mut inner = pair.into_inner();
    let primary = parse_primary_expression(
        inner
            .next()
            .ok_or(ParseError::missing(Rule::PrimaryExpression))?,
    )?;
    let mut expr = primary;

    for op_pair in inner {
        let end = op_pair.as_span().end();
        let operator = match op_pair.as_rule() {
            Rule::PostfixOperator => op_pair
                .into_inner()
                .next()
                .ok_or(ParseError::missing(Rule::PostfixOperator))?,
            _ => op_pair,
        };

        expr = match operator.as_rule() {
            Rule::CallOperator => parse_call_expression(expr, operator)?,
            Rule::MemberAccess => parse_member_expression(expr, operator)?,
            _ => return Err(ParseError::unexpected_rule(operator, None)),
        };

        let node_span = span_from_bounds(input, expr.span.start, end)
            .ok_or(ParseError::missing(Rule::PostfixExpression))?;
        expr = Spanned::new(expr.node, node_span);
    }

    Ok(Spanned::new(expr.node, span))
}

pub(crate) fn parse_primary_expression(
    pair: Pair<Rule>,
) -> Result<Spanned<Expression>, ParseError> {
    let inner = pair
        .into_inner()
        .next()
        .ok_or(ParseError::missing(Rule::Expression))?;
    parse_expression(inner)
}

