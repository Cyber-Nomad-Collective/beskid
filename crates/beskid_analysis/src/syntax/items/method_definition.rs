use pest::iterators::Pair;

use crate::parser::Rule;
use crate::parsing::error::ParseError;
use crate::parsing::parsable::Parsable;
use crate::syntax::items::parse_helpers::{parse_parameter_list, parse_visibility_or_default};
use crate::syntax::{
    Block, Identifier, Parameter, Path, PrimitiveType, SpanInfo, Spanned, Type, Visibility,
};

use beskid_ast_derive::AstNode;

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

fn parse_path_segment(pair: Pair<Rule>) -> Result<Spanned<crate::syntax::PathSegment>, ParseError> {
    let span = SpanInfo::from_span(&pair.as_span());
    let mut inner = pair.into_inner();
    let name = Identifier::parse(inner.next().ok_or(ParseError::missing(Rule::Identifier))?)?;
    let mut type_args = Vec::new();
    if let Some(args) = inner.next() {
        for arg in args.into_inner() {
            type_args.push(Type::parse(arg)?);
        }
    }
    Ok(Spanned::new(
        crate::syntax::PathSegment { name, type_args },
        span,
    ))
}

impl Parsable for MethodDefinition {
    fn parse(pair: Pair<Rule>) -> Result<Spanned<Self>, ParseError> {
        Err(ParseError::unexpected_rule(
            pair,
            Some(Rule::ImplMethodDefinition),
        ))
    }
}

impl MethodDefinition {
    pub(crate) fn parse_with_receiver(
        pair: Pair<Rule>,
        receiver_type: Spanned<Type>,
    ) -> Result<Spanned<Self>, ParseError> {
        let span = SpanInfo::from_span(&pair.as_span());
        let mut inner = pair.clone().into_inner().peekable();
        let visibility = parse_visibility_or_default(&pair, &mut inner)?;
        let return_type = Some(Type::parse(
            inner.next().ok_or(ParseError::missing(Rule::BeskidType))?,
        )?);
        let name = Identifier::parse(inner.next().ok_or(ParseError::missing(Rule::Identifier))?)?;

        let mut parameters = Vec::new();
        let mut body = None;

        for item in inner {
            match item.as_rule() {
                Rule::ParameterList => parameters = parse_parameter_list(item)?,
                Rule::Block => body = Some(Block::parse(item)?),
                _ => return Err(ParseError::unexpected_rule(item, None)),
            }
        }

        if let Some(parameter) = parameters
            .iter()
            .find(|parameter| parameter.node.name.node.name == "self")
        {
            return Err(ParseError::forbidden_impl_self_parameter(
                parameter.node.name.span,
            ));
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

pub(crate) fn parse_receiver_type(pair: Pair<Rule>) -> Result<Spanned<Type>, ParseError> {
    let span = SpanInfo::from_span(&pair.as_span());
    let first = if pair.as_rule() == Rule::ReceiverType {
        let mut inner = pair.into_inner();
        inner.next().ok_or(ParseError::missing(Rule::Identifier))?
    } else {
        pair
    };

    let node = match first.as_rule() {
        Rule::PrimitiveType => Type::Primitive(PrimitiveType::parse(first)?),
        Rule::PathSegment => {
            let segment = parse_path_segment(first)?;
            Type::Complex(Spanned::new(
                Path {
                    segments: vec![segment],
                },
                span,
            ))
        }
        Rule::Path => Type::Complex(Path::parse(first)?),
        _ => return Err(ParseError::unexpected_rule(first, Some(Rule::ReceiverType))),
    };

    Ok(Spanned::new(node, span))
}
