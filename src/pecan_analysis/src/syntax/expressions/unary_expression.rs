use pest::iterators::Pair;
use pest::Span;

use crate::parsing::error::ParseError;
use crate::parser::Rule;
use crate::syntax::{Expression, SpanInfo, Spanned};
use crate::syntax::expressions::span::span_from_bounds;

use pecan_ast_derive::AstNode;

#[derive(AstNode, Debug, Clone, PartialEq, Eq)]
pub struct UnaryExpression {
    #[ast(child)]
    pub op: Spanned<UnaryOp>,
    #[ast(child)]
    pub expr: Box<Spanned<Expression>>,
}

#[derive(AstNode, Debug, Clone, Copy, PartialEq, Eq)]
pub enum UnaryOp {
    Neg,
    Not,
}

pub(crate) fn parse_unary_expression(pair: Pair<Rule>) -> Result<Spanned<Expression>, ParseError> {
    let span = SpanInfo::from_span(&pair.as_span());
    let input = pair.as_span().get_input();
    let mut inner = pair.into_inner();
    let postfix = super::expression::parse_postfix_expression(
        inner
            .next()
            .ok_or(ParseError::missing(Rule::PostfixExpression))?,
    )?;

    let prefix_text = &input[span.start..postfix.span.start];
    let ops = parse_unary_ops(input, span.start, prefix_text)?;

    let mut expr = postfix;
    for op in ops.into_iter().rev() {
        let node_span = span_from_bounds(input, op.span.start, expr.span.end)
            .ok_or(ParseError::missing(Rule::UnaryExpression))?;
        let unary = Spanned::new(
            UnaryExpression {
                op,
                expr: Box::new(expr),
            },
            node_span,
        );
        expr = Spanned::new(Expression::Unary(unary), node_span);
    }

    Ok(Spanned::new(expr.node, span))
}

fn parse_unary_ops(
    input: &str,
    base_start: usize,
    prefix: &str,
) -> Result<Vec<Spanned<UnaryOp>>, ParseError> {
    let mut ops = Vec::new();
    for (offset, ch) in prefix.char_indices() {
        let op = match ch {
            '-' => UnaryOp::Neg,
            '!' => UnaryOp::Not,
            _ => continue,
        };
        let start = base_start + offset;
        let end = start + ch.len_utf8();
        let span = Span::new(input, start, end).ok_or(ParseError::missing(Rule::UnaryExpression))?;
        ops.push(Spanned::new(op, SpanInfo::from_span(&span)));
    }

    Ok(ops)
}

