use pecan_ast_derive::AstNode;

#[derive(AstNode, Debug, Clone, PartialEq, Eq)]
pub enum Literal {
    #[ast(skip)]
    Integer(String),
    #[ast(skip)]
    Float(String),
    #[ast(skip)]
    String(String),
    #[ast(skip)]
    Char(String),
    #[ast(skip)]
    Bool(bool),
}

impl crate::parsing::parsable::Parsable for Literal {
    fn parse(
        pair: pest::iterators::Pair<crate::parser::Rule>,
    ) -> Result<crate::syntax::Spanned<Self>, crate::parsing::error::ParseError> {
        let span = crate::syntax::SpanInfo::from_span(&pair.as_span());
        let rule = pair.as_rule();
        let text = pair.as_str();

        let node = match rule {
            crate::parser::Rule::IntegerLiteral => Self::Integer(text.to_string()),
            crate::parser::Rule::FloatLiteral => Self::Float(text.to_string()),
            crate::parser::Rule::StringLiteral => Self::String(text.to_string()),
            crate::parser::Rule::CharLiteral => Self::Char(text.to_string()),
            crate::parser::Rule::Literal => {
                let mut inner = pair.clone().into_inner();
                if let Some(inner_pair) = inner.next() {
                    return Self::parse(inner_pair);
                }

                match text {
                    "true" => Self::Bool(true),
                    "false" => Self::Bool(false),
                    _ => {
                        return Err(crate::parsing::error::ParseError::unexpected_rule(
                            pair,
                            Some(crate::parser::Rule::Literal),
                        ))
                    }
                }
            }
            _ => {
                return Err(crate::parsing::error::ParseError::unexpected_rule(
                    pair,
                    Some(crate::parser::Rule::Literal),
                ))
            }
        };

        Ok(crate::syntax::Spanned::new(node, span))
    }
}
