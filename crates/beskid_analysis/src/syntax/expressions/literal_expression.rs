use pest::Parser;
use pest::iterators::Pair;

use crate::parser::BeskidParser;
use crate::parser::Rule;
use crate::parsing::error::ParseError;
use crate::parsing::parsable::Parsable;
use crate::syntax::expressions::span::span_from_bounds;
use crate::syntax::{Expression, Literal, SpanInfo, Spanned};

use beskid_ast_derive::AstNode;

#[derive(AstNode, Debug, Clone, PartialEq, Eq)]
pub struct LiteralExpression {
    #[ast(child)]
    pub literal: Spanned<Literal>,
}

pub(crate) fn parse_literal_expression(
    pair: Pair<Rule>,
) -> Result<Spanned<Expression>, ParseError> {
    let input = pair.as_span().get_input();
    let span = SpanInfo::from_span(&pair.as_span());
    let literal = Literal::parse(pair)?;

    if let Literal::String(value) = &literal.node
        && let Some(expr) = try_desugar_interpolated_string(value, input, span)
    {
        return Ok(expr);
    }

    let literal_expr = Spanned::new(LiteralExpression { literal }, span);

    Ok(Spanned::new(Expression::Literal(literal_expr), span))
}

fn try_desugar_interpolated_string(
    source: &str,
    input: &str,
    literal_span: SpanInfo,
) -> Option<Spanned<Expression>> {
    if source.len() < 2 || !source.starts_with('"') || !source.ends_with('"') {
        return None;
    }

    let mut parts = Vec::new();
    let bytes = source.as_bytes();
    let content_start = literal_span.start + 1;
    let content_end = literal_span.end.saturating_sub(1);
    let mut cursor = content_start;
    let mut text_start = content_start;

    while cursor < content_end {
        let relative = cursor - literal_span.start;

        if bytes.get(relative) == Some(&b'\\') {
            cursor = cursor.saturating_add(1);
            if cursor < content_end {
                cursor = cursor.saturating_add(1);
            }
            continue;
        }

        if bytes.get(relative) == Some(&b'$') && bytes.get(relative + 1) == Some(&b'{') {
            if text_start < cursor {
                let text =
                    source.get(text_start - literal_span.start..cursor - literal_span.start)?;
                let span = span_from_bounds(input, text_start, cursor)?;
                parts.push(InterpolationPart::Text {
                    text: text.to_string(),
                    span,
                });
            }

            let expr_start = cursor + 2;
            let Some(expr_end) =
                find_interpolation_end(bytes, literal_span.start, expr_start, content_end)
            else {
                return None;
            };

            let expr_text =
                source.get(expr_start - literal_span.start..expr_end - literal_span.start)?;
            let trim_start = expr_text.len().saturating_sub(expr_text.trim_start().len());
            let trim_end = expr_text.len().saturating_sub(expr_text.trim_end().len());
            let expr_trimmed = expr_text.trim();
            if expr_trimmed.is_empty() {
                return None;
            }

            let expr_span_start = expr_start + trim_start;
            let expr_span_end = expr_start + trim_end;
            let expression_span = span_from_bounds(input, expr_span_start, expr_span_end)?;
            let expression = parse_interpolation_expression(expr_trimmed, expression_span)?;
            parts.push(InterpolationPart::Expr(expression));

            cursor = expr_end + 1;
            text_start = cursor;
            continue;
        }

        cursor += 1;
    }

    if parts.is_empty() {
        return None;
    }

    if text_start < content_end {
        let text = source.get(text_start - literal_span.start..content_end - literal_span.start)?;
        let span = span_from_bounds(input, text_start, content_end)?;
        parts.push(InterpolationPart::Text {
            text: text.to_string(),
            span,
        });
    }

    build_interpolated_expression(parts)
}

fn build_interpolated_expression(parts: Vec<InterpolationPart>) -> Option<Spanned<Expression>> {
    let mut iter = parts.into_iter().map(part_to_expression);
    let mut acc = iter.next()?;
    for next in iter {
        let combined_span = SpanInfo {
            start: acc.span.start,
            end: next.span.end,
            line_col_start: acc.span.line_col_start,
            line_col_end: next.span.line_col_end,
        };
        let op = Spanned::new(crate::syntax::BinaryOp::Add, acc.span);
        let binary = Spanned::new(
            crate::syntax::BinaryExpression {
                left: Box::new(acc),
                op,
                right: Box::new(next),
            },
            combined_span,
        );
        acc = Spanned::new(Expression::Binary(binary), combined_span);
    }
    Some(acc)
}

fn part_to_expression(part: InterpolationPart) -> Spanned<Expression> {
    match part {
        InterpolationPart::Text { text, span } => {
            let literal = Spanned::new(Literal::String(format!("\"{text}\"")), span);
            let literal_expr = Spanned::new(LiteralExpression { literal }, span);
            Spanned::new(Expression::Literal(literal_expr), span)
        }
        InterpolationPart::Expr(expression) => {
            let span = expression.span;
            Spanned::new(expression.node, span)
        }
    }
}

fn parse_interpolation_expression(
    expr_source: &str,
    expr_span: SpanInfo,
) -> Option<Spanned<Expression>> {
    let mut pairs = BeskidParser::parse(Rule::Expression, expr_source).ok()?;
    let pair = pairs.next()?;
    if pairs.next().is_some() {
        return None;
    }

    let expression = Expression::parse(pair).ok()?;
    Some(Spanned::new(expression.node, expr_span))
}

fn find_interpolation_end(
    bytes: &[u8],
    literal_start: usize,
    expr_start: usize,
    content_end: usize,
) -> Option<usize> {
    let mut cursor = expr_start;
    let mut brace_depth = 0usize;
    let mut in_string = false;
    let mut in_char = false;
    let mut escaped = false;

    while cursor < content_end {
        let rel = cursor - literal_start;
        let byte = *bytes.get(rel)?;

        if escaped {
            escaped = false;
            cursor += 1;
            continue;
        }

        if byte == b'\\' {
            escaped = true;
            cursor += 1;
            continue;
        }

        if in_string {
            if byte == b'"' {
                in_string = false;
            }
            cursor += 1;
            continue;
        }

        if in_char {
            if byte == b'\'' {
                in_char = false;
            }
            cursor += 1;
            continue;
        }

        match byte {
            b'"' => in_string = true,
            b'\'' => in_char = true,
            b'{' => brace_depth = brace_depth.saturating_add(1),
            b'}' => {
                if brace_depth == 0 {
                    return Some(cursor);
                }
                brace_depth = brace_depth.saturating_sub(1);
            }
            _ => {}
        }

        cursor += 1;
    }

    None
}

enum InterpolationPart {
    Text { text: String, span: SpanInfo },
    Expr(Spanned<Expression>),
}
