use pest::iterators::Pair;

use crate::parsing::error::ParseError;
use crate::parsing::parsable::Parsable;
use crate::parser::Rule;
use crate::syntax::{Block, Identifier, Parameter, Path, PrimitiveType, SpanInfo, Spanned, Type, Visibility};
use crate::syntax::items::parse_helpers::{
    parse_parameter_list, parse_visibility_or_default,
};

use pecan_ast_derive::AstNode;

#[derive(AstNode, Debug, Clone, PartialEq, Eq)]
pub struct MethodDefinition {
    #[ast(child)]
    pub visibility: Spanned<Visibility>,
    #[ast(child)]
    pub receiver_type: Spanned<Type>,
    #[ast(child)]
    pub name: Spanned<Identifier>,
    #[ast(children)]
    pub parameters: Vec<Spanned<Parameter>>,
    #[ast(child)]
    pub return_type: Option<Spanned<Type>>,
    #[ast(child)]
    pub body: Spanned<Block>,
}

impl Parsable for MethodDefinition {
    fn parse(pair: Pair<Rule>) -> Result<Spanned<Self>, ParseError> {
        let span = SpanInfo::from_span(&pair.as_span());
        let mut inner = pair.clone().into_inner().peekable();
        let visibility = parse_visibility_or_default(&pair, &mut inner)?;
        let return_type = Some(Type::parse(
            inner
                .next()
                .ok_or(ParseError::missing(Rule::PecanType))?,
        )?);
        let receiver_type = parse_receiver_type(
            inner
                .next()
                .ok_or(ParseError::missing(Rule::ReceiverType))?,
        )?;
        let name = Identifier::parse(
            inner
                .next()
                .ok_or(ParseError::missing(Rule::Identifier))?,
        )?;

        let mut parameters = Vec::new();
        let mut body = None;

        for item in inner {
            match item.as_rule() {
                Rule::ParameterList => parameters = parse_parameter_list(item)?,
                Rule::Block => body = Some(Block::parse(item)?),
                _ => return Err(ParseError::unexpected_rule(item, None)),
            }
        }

        Ok(Spanned::new(
            Self {
                visibility,
                receiver_type,
                name,
                parameters,
                return_type,
                body: body.ok_or(ParseError::missing(Rule::Block))?,
            },
            span,
        ))
    }
}

fn parse_receiver_type(pair: Pair<Rule>) -> Result<Spanned<Type>, ParseError> {
    let span = SpanInfo::from_span(&pair.as_span());
    let mut inner = pair.into_inner();
    let first = inner
        .next()
        .ok_or(ParseError::missing(Rule::Identifier))?;

    let node = match first.as_rule() {
        Rule::PrimitiveType => Type::Primitive(PrimitiveType::parse(first)?),
        Rule::Identifier => {
            let identifier = Identifier::parse(first)?;
            let path = Spanned::new(Path { segments: vec![identifier] }, span);
            Type::Complex(path)
        }
        _ => return Err(ParseError::unexpected_rule(first, Some(Rule::ReceiverType))),
    };

    Ok(Spanned::new(node, span))
}
