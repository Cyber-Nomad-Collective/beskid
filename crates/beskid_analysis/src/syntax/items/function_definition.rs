use pest::iterators::Pair;

use crate::parser::Rule;
use crate::parsing::error::ParseError;
use crate::parsing::parsable::Parsable;
use crate::syntax::items::parse_helpers::{
    parse_identifier_list, parse_parameter_list, parse_visibility_or_default,
};
use crate::syntax::{Block, Identifier, Parameter, SpanInfo, Spanned, Type, Visibility};

use beskid_ast_derive::AstNode;

#[derive(AstNode, Debug, Clone, PartialEq, Eq)]
pub struct FunctionDefinition {
    #[ast(child)]
    pub visibility: Spanned<Visibility>,
    #[ast(child)]
    pub name: Spanned<Identifier>,
    #[ast(children)]
    pub generics: Vec<Spanned<Identifier>>,
    #[ast(children)]
    pub parameters: Vec<Spanned<Parameter>>,
    #[ast(child)]
    pub return_type: Option<Spanned<Type>>,
    #[ast(child)]
    pub body: Spanned<Block>,
}

impl Parsable for FunctionDefinition {
    fn parse(pair: Pair<Rule>) -> Result<Spanned<Self>, ParseError> {
        let span = SpanInfo::from_span(&pair.as_span());
        let mut inner = pair.clone().into_inner().peekable();
        let visibility = parse_visibility_or_default(&pair, &mut inner)?;
        let return_type = Some(Type::parse(
            inner.next().ok_or(ParseError::missing(Rule::BeskidType))?,
        )?);
        let name = Identifier::parse(inner.next().ok_or(ParseError::missing(Rule::Identifier))?)?;

        let mut generics = Vec::new();
        let mut parameters = Vec::new();
        let mut body = None;

        for item in inner {
            match item.as_rule() {
                Rule::GenericParameters => {
                    generics = parse_identifier_list(item)?;
                }
                Rule::ParameterList => {
                    parameters = parse_parameter_list(item)?;
                }
                Rule::Block => {
                    body = Some(Block::parse(item)?);
                }
                _ => return Err(ParseError::unexpected_rule(item, None)),
            }
        }

        Ok(Spanned::new(
            Self {
                visibility,
                name,
                generics,
                parameters,
                return_type,
                body: body.ok_or(ParseError::missing(Rule::Block))?,
            },
            span,
        ))
    }
}
