use pest::iterators::Pair;

use crate::parser::Rule;
use crate::parsing::error::ParseError;
use crate::parsing::parsable::Parsable;
use crate::syntax::{Block, Expression, SpanInfo, Spanned};

use beskid_ast_derive::AstNode;

#[derive(AstNode, Debug, Clone, PartialEq, Eq)]
pub struct BlockExpression {
    #[ast(child)]
    pub block: Spanned<Block>,
}

pub(crate) fn parse_block_expression(pair: Pair<Rule>) -> Result<Spanned<Expression>, ParseError> {
    let span = SpanInfo::from_span(&pair.as_span());
    let inner = pair
        .into_inner()
        .next()
        .ok_or(ParseError::missing(Rule::Block))?;
    let block = Block::parse(inner)?;
    let block_expr = Spanned::new(BlockExpression { block }, span);

    Ok(Spanned::new(Expression::Block(block_expr), span))
}
