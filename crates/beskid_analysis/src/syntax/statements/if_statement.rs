use pest::iterators::Pair;

use crate::parser::Rule;
use crate::parsing::error::ParseError;
use crate::parsing::parsable::Parsable;
use crate::syntax::{Block, Expression, SpanInfo, Spanned};

use beskid_ast_derive::AstNode;

#[derive(AstNode, Debug, Clone, PartialEq, Eq)]
pub struct IfStatement {
    #[ast(child)]
    pub condition: Spanned<Expression>,
    #[ast(child)]
    pub then_block: Spanned<Block>,
    #[ast(child)]
    pub else_block: Option<Spanned<Block>>,
}

impl Parsable for IfStatement {
    fn parse(pair: Pair<Rule>) -> Result<Spanned<Self>, ParseError> {
        let span = SpanInfo::from_span(&pair.as_span());
        let mut inner = pair.into_inner();
        let condition =
            Expression::parse(inner.next().ok_or(ParseError::missing(Rule::Expression))?)?;
        let then_block = Block::parse(inner.next().ok_or(ParseError::missing(Rule::Block))?)?;
        let else_block = inner.next().map(Block::parse).transpose()?;

        Ok(Spanned::new(
            Self {
                condition,
                then_block,
                else_block,
            },
            span,
        ))
    }
}
