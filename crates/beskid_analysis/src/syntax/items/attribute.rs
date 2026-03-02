use pest::iterators::Pair;

use crate::parser::Rule;
use crate::parsing::error::ParseError;
use crate::parsing::parsable::Parsable;
use crate::syntax::{Expression, Identifier, SpanInfo, Spanned, Type, Visibility};

use super::parse_helpers::parse_visibility_or_default;

use beskid_ast_derive::AstNode;

#[derive(AstNode, Debug, Clone, PartialEq, Eq)]
pub struct Attribute {
    #[ast(child)]
    pub name: Spanned<Identifier>,
    #[ast(children)]
    pub arguments: Vec<Spanned<AttributeArgument>>,
}

#[derive(AstNode, Debug, Clone, PartialEq, Eq)]
pub struct AttributeDeclaration {
    #[ast(child)]
    pub visibility: Spanned<Visibility>,
    #[ast(child)]
    pub name: Spanned<Identifier>,
    #[ast(children)]
    pub targets: Vec<Spanned<AttributeTarget>>,
    #[ast(children)]
    pub parameters: Vec<Spanned<AttributeParameter>>,
}

#[derive(AstNode, Debug, Clone, PartialEq, Eq)]
pub struct AttributeTarget {
    #[ast(child)]
    pub name: Spanned<Identifier>,
}

#[derive(AstNode, Debug, Clone, PartialEq, Eq)]
pub struct AttributeParameter {
    #[ast(child)]
    pub name: Spanned<Identifier>,
    #[ast(child)]
    pub ty: Spanned<Type>,
    #[ast(child)]
    pub default_value: Option<Spanned<Expression>>,
}

#[derive(AstNode, Debug, Clone, PartialEq, Eq)]
pub struct AttributeArgument {
    #[ast(child)]
    pub name: Spanned<Identifier>,
    #[ast(child)]
    pub value: Spanned<Expression>,
}

impl Parsable for AttributeDeclaration {
    fn parse(pair: Pair<Rule>) -> Result<Spanned<Self>, ParseError> {
        if pair.as_rule() != Rule::AttributeDeclaration {
            return Err(ParseError::unexpected_rule(
                pair,
                Some(Rule::AttributeDeclaration),
            ));
        }
        let span = SpanInfo::from_span(&pair.as_span());
        let mut inner = pair.clone().into_inner().peekable();
        let visibility = parse_visibility_or_default(&pair, &mut inner)?;
        let name = Identifier::parse(inner.next().ok_or(ParseError::missing(Rule::Identifier))?)?;
        let mut targets = Vec::new();
        let mut parameters = Vec::new();

        for item in inner {
            match item.as_rule() {
                Rule::AttributeTargetList => {
                    targets = item
                        .into_inner()
                        .map(AttributeTarget::parse)
                        .collect::<Result<Vec<_>, _>>()?;
                }
                Rule::AttributeParameterList => {
                    parameters = item
                        .into_inner()
                        .map(AttributeParameter::parse)
                        .collect::<Result<Vec<_>, _>>()?;
                }
                _ => return Err(ParseError::unexpected_rule(item, None)),
            }
        }

        Ok(Spanned::new(
            Self {
                visibility,
                name,
                targets,
                parameters,
            },
            span,
        ))
    }
}

impl Parsable for AttributeTarget {
    fn parse(pair: Pair<Rule>) -> Result<Spanned<Self>, ParseError> {
        if pair.as_rule() != Rule::AttributeTarget {
            return Err(ParseError::unexpected_rule(pair, Some(Rule::AttributeTarget)));
        }
        let span = SpanInfo::from_span(&pair.as_span());
        let mut inner = pair.into_inner();
        let name = Identifier::parse(inner.next().ok_or(ParseError::missing(Rule::Identifier))?)?;

        Ok(Spanned::new(Self { name }, span))
    }
}

impl Parsable for AttributeParameter {
    fn parse(pair: Pair<Rule>) -> Result<Spanned<Self>, ParseError> {
        if pair.as_rule() != Rule::AttributeParameter {
            return Err(ParseError::unexpected_rule(
                pair,
                Some(Rule::AttributeParameter),
            ));
        }
        let span = SpanInfo::from_span(&pair.as_span());
        let mut inner = pair.into_inner();
        let name = Identifier::parse(inner.next().ok_or(ParseError::missing(Rule::Identifier))?)?;
        let ty = Type::parse(inner.next().ok_or(ParseError::missing(Rule::BeskidType))?)?;
        let default_value = match inner.next() {
            Some(default_pair) => Some(Expression::parse(default_pair)?),
            None => None,
        };

        Ok(Spanned::new(
            Self {
                name,
                ty,
                default_value,
            },
            span,
        ))
    }
}

impl Parsable for Attribute {
    fn parse(pair: Pair<Rule>) -> Result<Spanned<Self>, ParseError> {
        if pair.as_rule() != Rule::Attribute {
            return Err(ParseError::unexpected_rule(pair, Some(Rule::Attribute)));
        }
        let span = SpanInfo::from_span(&pair.as_span());
        let mut inner = pair.into_inner();
        let name = Identifier::parse(inner.next().ok_or(ParseError::missing(Rule::Identifier))?)?;
        let arguments = if let Some(args) = inner.next() {
            args.into_inner()
                .map(AttributeArgument::parse)
                .collect::<Result<Vec<_>, _>>()?
        } else {
            Vec::new()
        };

        Ok(Spanned::new(Self { name, arguments }, span))
    }
}

impl Parsable for AttributeArgument {
    fn parse(pair: Pair<Rule>) -> Result<Spanned<Self>, ParseError> {
        if pair.as_rule() != Rule::AttributeArgument {
            return Err(ParseError::unexpected_rule(pair, Some(Rule::AttributeArgument)));
        }
        let span = SpanInfo::from_span(&pair.as_span());
        let mut inner = pair.into_inner();
        let name = Identifier::parse(inner.next().ok_or(ParseError::missing(Rule::Identifier))?)?;
        let value = Expression::parse(inner.next().ok_or(ParseError::missing(Rule::Expression))?)?;

        Ok(Spanned::new(Self { name, value }, span))
    }
}
