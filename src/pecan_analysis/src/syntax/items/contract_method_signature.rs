use pest::iterators::Pair;

use crate::parsing::error::ParseError;
use crate::parsing::parsable::Parsable;
use crate::parser::Rule;
use crate::syntax::{Identifier, Parameter, SpanInfo, Spanned, Type};
use crate::syntax::items::parse_helpers::parse_parameter_list;

use pecan_ast_derive::AstNode;

#[derive(AstNode, Debug, Clone, PartialEq, Eq)]
pub struct ContractMethodSignature {
    #[ast(child)]
    pub name: Spanned<Identifier>,
    #[ast(children)]
    pub parameters: Vec<Spanned<Parameter>>,
    #[ast(child)]
    pub return_type: Option<Spanned<Type>>,
}

impl Parsable for ContractMethodSignature {
    fn parse(pair: Pair<Rule>) -> Result<Spanned<Self>, ParseError> {
        let span = SpanInfo::from_span(&pair.as_span());
        let mut inner = pair.into_inner();
        let return_type = Some(Type::parse(
            inner
                .next()
                .ok_or(ParseError::missing(Rule::PecanType))?,
        )?);
        let name = Identifier::parse(
            inner
                .next()
                .ok_or(ParseError::missing(Rule::Identifier))?,
        )?;
        let mut parameters = Vec::new();

        for item in inner {
            match item.as_rule() {
                Rule::ParameterList => parameters = parse_parameter_list(item)?,
                _ => return Err(ParseError::unexpected_rule(item, None)),
            }
        }

        Ok(Spanned::new(
            Self {
                name,
                parameters,
                return_type,
            },
            span,
        ))
    }
}
