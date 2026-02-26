use pest::iterators::Pair;

use crate::parsing::error::ParseError;
use crate::parsing::parsable::Parsable;
use crate::parser::Rule;
use crate::syntax::{Expression, Identifier, SpanInfo, Spanned, Type};

use beskid_ast_derive::AstNode;

#[derive(AstNode, Debug, Clone, PartialEq, Eq)]
pub struct LetStatement {
    #[ast(skip)]
    pub mutable: bool,
    #[ast(child)]
    pub name: Spanned<Identifier>,
    #[ast(child)]
    pub type_annotation: Option<Spanned<Type>>,
    #[ast(child)]
    pub value: Spanned<Expression>,
}

impl Parsable for LetStatement {
    fn parse(pair: Pair<Rule>) -> Result<Spanned<Self>, ParseError> {
        let span = SpanInfo::from_span(&pair.as_span());
        if pair.as_rule() == Rule::LetStatement {
            let inner = pair
                .into_inner()
                .next()
                .ok_or(ParseError::missing(Rule::LetStatement))?;
            let parsed = Self::parse(inner)?;
            return Ok(Spanned::new(parsed.node, span));
        }

        let rule = pair.as_rule();
        let error_pair = pair.clone();
        let mut inner = pair.into_inner();
        let (mut mutable, mut name_pair, mut value_pair, mut type_annotation) =
            (false, None, None, None);

        match rule {
            Rule::TypedLetStatement => {
                let type_pair = inner
                    .next()
                    .ok_or(ParseError::missing(Rule::BeskidType))?;
                type_annotation = Some(Type::parse(type_pair)?);
            }
            Rule::InferredLetStatement => {
                inner
                    .next()
                    .filter(|item| item.as_rule() == Rule::LetKeyword)
                    .ok_or(ParseError::missing(Rule::LetKeyword))?;
            }
            _ => return Err(ParseError::unexpected_rule(error_pair, Some(Rule::LetStatement))),
        }

        for item in inner {
            match item.as_rule() {
                Rule::LetKeyword => {}
                Rule::MutKeyword => {
                    if name_pair.is_some() {
                        return Err(ParseError::unexpected_rule(item, None));
                    }
                    mutable = true;
                }
                Rule::Identifier => name_pair = Some(item),
                Rule::Expression => value_pair = Some(item),
                _ => return Err(ParseError::unexpected_rule(item, None)),
            }
        }

        let name = Identifier::parse(
            name_pair.ok_or(ParseError::missing(Rule::Identifier))?,
        )?;
        let value = Expression::parse(
            value_pair.ok_or(ParseError::missing(Rule::Expression))?,
        )?;

        Ok(Spanned::new(
            Self {
                mutable,
                name,
                type_annotation,
                value,
            },
            span,
        ))
    }
}
