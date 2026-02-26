use pest::iterators::Pair;

use crate::parsing::error::ParseError;
use crate::parsing::parsable::Parsable;
use crate::parser::Rule;
use crate::syntax::{Field, Identifier, SpanInfo, Spanned};
use crate::syntax::items::parse_helpers::parse_field_list;

use beskid_ast_derive::AstNode;

#[derive(AstNode, Debug, Clone, PartialEq, Eq)]
pub struct EnumVariant {
    #[ast(child)]
    pub name: Spanned<Identifier>,
    #[ast(children)]
    pub fields: Vec<Spanned<Field>>,
}

impl Parsable for EnumVariant {
    fn parse(pair: Pair<Rule>) -> Result<Spanned<Self>, ParseError> {
        let span = SpanInfo::from_span(&pair.as_span());
        let mut inner = pair.into_inner();
        let name = Identifier::parse(
            inner
                .next()
                .ok_or(ParseError::missing(Rule::Identifier))?,
        )?;
        let fields = if let Some(field_list) = inner.next() {
            parse_field_list(field_list)?
        } else {
            Vec::new()
        };

        Ok(Spanned::new(Self { name, fields }, span))
    }
}
