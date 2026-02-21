use pest::iterators::Pair;

use crate::parsing::error::ParseError;
use crate::parsing::parsable::Parsable;
use crate::parser::Rule;
use crate::syntax::{Expression, Identifier, SpanInfo, Spanned, Type};

use pecan_ast_derive::AstNode;

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
        let mut inner = pair.clone().into_inner();
        let mutable = pair.as_str().starts_with("let mut");
        let name = Identifier::parse(
            inner
                .next()
                .ok_or(ParseError::missing(Rule::Identifier))?,
        )?;

        let mut type_annotation = None;
        let mut value_pair = None;

        for item in inner {
            match item.as_rule() {
                Rule::TypeAnnotation => {
                    let type_pair = item
                        .into_inner()
                        .next()
                        .ok_or(ParseError::missing(Rule::PecanType))?;
                    type_annotation = Some(Type::parse(type_pair)?);
                }
                Rule::Expression => value_pair = Some(item),
                _ => return Err(ParseError::unexpected_rule(item, None)),
            }
        }

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
