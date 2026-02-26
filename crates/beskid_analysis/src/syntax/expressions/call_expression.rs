use pest::iterators::Pair;

use crate::parser::Rule;
use crate::parsing::error::ParseError;
use crate::parsing::parsable::Parsable;
use crate::syntax::{Expression, SpanInfo, Spanned};

use beskid_ast_derive::AstNode;

#[derive(AstNode, Debug, Clone, PartialEq, Eq)]
pub struct CallExpression {
    #[ast(child)]
    pub callee: Box<Spanned<Expression>>,
    #[ast(children)]
    pub args: Vec<Spanned<Expression>>,
}

pub(crate) fn parse_call_expression(
    callee: Spanned<Expression>,
    pair: Pair<Rule>,
) -> Result<Spanned<Expression>, ParseError> {
    let span = SpanInfo::from_span(&pair.as_span());
    let args = if let Some(arg_list) = pair.into_inner().next() {
        arg_list
            .into_inner()
            .map(Expression::parse)
            .collect::<Result<Vec<_>, _>>()?
    } else {
        Vec::new()
    };

    let call = Spanned::new(
        CallExpression {
            callee: Box::new(callee),
            args,
        },
        span,
    );

    Ok(Spanned::new(Expression::Call(call), span))
}
