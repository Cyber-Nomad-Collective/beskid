use pest::iterators::Pair;

use crate::parser::Rule;
use crate::parsing::error::ParseError;
use crate::parsing::parsable::Parsable;
use crate::syntax::items::method_definition::parse_receiver_type;
use crate::syntax::{MethodDefinition, SpanInfo, Spanned, Type};

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ImplBlock {
    pub receiver_type: Spanned<Type>,
    pub methods: Vec<Spanned<MethodDefinition>>,
}

impl Parsable for ImplBlock {
    fn parse(pair: Pair<Rule>) -> Result<Spanned<Self>, ParseError> {
        let span = SpanInfo::from_span(&pair.as_span());
        let mut inner = pair.into_inner();

        let receiver_pair = inner
            .next()
            .ok_or(ParseError::missing(Rule::ReceiverType))?;
        let receiver_type = parse_receiver_type(receiver_pair)?;

        let mut methods = Vec::new();
        for method_pair in inner {
            if method_pair.as_rule() != Rule::ImplMethodDefinition {
                return Err(ParseError::unexpected_rule(method_pair, Some(Rule::ImplMethodDefinition)));
            }
            methods.push(MethodDefinition::parse_with_receiver(
                method_pair,
                receiver_type.clone(),
            )?);
        }

        Ok(Spanned::new(
            Self {
                receiver_type,
                methods,
            },
            span,
        ))
    }
}
