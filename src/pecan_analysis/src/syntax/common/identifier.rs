use pecan_ast_derive::AstNode;

#[derive(AstNode, Debug, Clone, PartialEq, Eq, Hash)]
pub struct Identifier {
    pub name: String,
}

impl crate::parsing::parsable::Parsable for Identifier {
    fn parse(
        pair: pest::iterators::Pair<crate::parser::Rule>,
    ) -> Result<crate::syntax::Spanned<Self>, crate::parsing::error::ParseError> {
        if pair.as_rule() != crate::parser::Rule::Identifier {
            return Err(crate::parsing::error::ParseError::unexpected_rule(
                pair,
                Some(crate::parser::Rule::Identifier),
            ));
        }

        let span = crate::syntax::SpanInfo::from_span(&pair.as_span());
        let name = pair.as_str().to_string();
        Ok(crate::syntax::Spanned::new(Self { name }, span))
    }
}
