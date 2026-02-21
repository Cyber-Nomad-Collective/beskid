use pest::iterators::Pair;

use crate::parsing::error::ParseError;
use crate::parsing::parsable::Parsable;
use crate::parser::Rule;
use crate::syntax::{EnumPath, Identifier, Literal, SpanInfo, Spanned};

use pecan_ast_derive::AstNode;

#[derive(AstNode, Debug, Clone, PartialEq, Eq)]
pub enum Pattern {
    #[ast(skip)]
    Wildcard,
    #[ast(child)]
    Identifier(Spanned<Identifier>),
    #[ast(child)]
    Literal(Spanned<Literal>),
    #[ast(child)]
    Enum(Spanned<EnumPattern>),
}

#[derive(AstNode, Debug, Clone, PartialEq, Eq)]
pub struct EnumPattern {
    #[ast(child)]
    pub path: Spanned<EnumPath>,
    #[ast(children)]
    pub items: Vec<Spanned<Pattern>>,
}

impl Parsable for Pattern {
    fn parse(pair: Pair<Rule>) -> Result<Spanned<Self>, ParseError> {
        let span = SpanInfo::from_span(&pair.as_span());
        let rule = pair.as_rule();

        let node = match rule {
            Rule::Pattern => {
                if let Some(inner) = pair.clone().into_inner().next() {
                    return Self::parse(inner);
                }
                if pair.as_str() == "_" {
                    Pattern::Wildcard
                } else {
                    return Err(ParseError::unexpected_rule(pair, Some(Rule::Pattern)));
                }
            }
            Rule::EnumPattern => {
                let pattern = EnumPattern::parse(pair)?;
                Pattern::Enum(pattern)
            }
            Rule::Identifier => Pattern::Identifier(Identifier::parse(pair)?),
            Rule::Literal => Pattern::Literal(Literal::parse(pair)?),
            _ => return Err(ParseError::unexpected_rule(pair, Some(Rule::Pattern))),
        };

        Ok(Spanned::new(node, span))
    }
}

impl Parsable for EnumPattern {
    fn parse(pair: Pair<Rule>) -> Result<Spanned<Self>, ParseError> {
        let span = SpanInfo::from_span(&pair.as_span());
        let mut inner = pair.into_inner();
        let path = EnumPath::parse(
            inner
                .next()
                .ok_or(ParseError::missing(Rule::EnumPath))?,
        )?;
        let items = if let Some(list) = inner.next() {
            list.into_inner().map(Pattern::parse).collect::<Result<Vec<_>, _>>()?
        } else {
            Vec::new()
        };

        Ok(Spanned::new(Self { path, items }, span))
    }
}
