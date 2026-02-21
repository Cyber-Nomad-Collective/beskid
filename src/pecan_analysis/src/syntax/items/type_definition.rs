use pest::iterators::Pair;

use crate::parsing::error::ParseError;
use crate::parsing::parsable::Parsable;
use crate::parser::Rule;
use crate::syntax::{Field, Identifier, SpanInfo, Spanned, Visibility};
use crate::syntax::items::parse_helpers::{
    parse_field_list, parse_identifier_list, parse_visibility_or_default,
};

use pecan_ast_derive::AstNode;

#[derive(AstNode, Debug, Clone, PartialEq, Eq)]
pub struct TypeDefinition {
    #[ast(child)]
    pub visibility: Spanned<Visibility>,
    #[ast(child)]
    pub name: Spanned<Identifier>,
    #[ast(children)]
    pub generics: Vec<Spanned<Identifier>>,
    #[ast(children)]
    pub fields: Vec<Spanned<Field>>,
}

impl Parsable for TypeDefinition {
    fn parse(pair: Pair<Rule>) -> Result<Spanned<Self>, ParseError> {
        let span = SpanInfo::from_span(&pair.as_span());
        let mut inner = pair.clone().into_inner().peekable();
        let visibility = parse_visibility_or_default(&pair, &mut inner)?;
        let name = Identifier::parse(
            inner
                .next()
                .ok_or(ParseError::missing(Rule::Identifier))?,
        )?;

        let mut generics = Vec::new();
        let mut fields = Vec::new();

        for item in inner {
            match item.as_rule() {
                Rule::GenericParameters => generics = parse_identifier_list(item)?,
                Rule::FieldList => fields = parse_field_list(item)?,
                _ => return Err(ParseError::unexpected_rule(item, None)),
            }
        }

        Ok(Spanned::new(
            Self {
                visibility,
                name,
                generics,
                fields,
            },
            span,
        ))
    }
}
