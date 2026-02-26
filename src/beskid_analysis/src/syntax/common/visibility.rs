use beskid_ast_derive::AstNode;

#[derive(AstNode, Debug, Clone, Copy, PartialEq, Eq)]
pub enum Visibility {
    Public,
    Private,
}

impl crate::parsing::parsable::Parsable for Visibility {
    fn parse(
        pair: pest::iterators::Pair<crate::parser::Rule>,
    ) -> Result<crate::syntax::Spanned<Self>, crate::parsing::error::ParseError> {
        if pair.as_rule() != crate::parser::Rule::Visibility {
            return Err(crate::parsing::error::ParseError::unexpected_rule(
                pair,
                Some(crate::parser::Rule::Visibility),
            ));
        }

        let span = crate::syntax::SpanInfo::from_span(&pair.as_span());
        Ok(crate::syntax::Spanned::new(Self::Public, span))
    }
}
