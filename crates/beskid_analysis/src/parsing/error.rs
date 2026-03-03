use pest::iterators::Pair;

use crate::parser::Rule;
use crate::syntax::SpanInfo;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ParseError {
    UnexpectedRule {
        expected: Option<Rule>,
        found: Rule,
        span: SpanInfo,
    },
    MissingPair {
        expected: Rule,
    },
    ForbiddenImplSelfParameter {
        span: SpanInfo,
    },
}

impl ParseError {
    pub fn unexpected_rule(pair: Pair<Rule>, expected: Option<Rule>) -> Self {
        Self::UnexpectedRule {
            expected,
            found: pair.as_rule(),
            span: SpanInfo::from_span(&pair.as_span()),
        }
    }

    pub fn missing(expected: Rule) -> Self {
        Self::MissingPair { expected }
    }

    pub fn forbidden_impl_self_parameter(span: SpanInfo) -> Self {
        Self::ForbiddenImplSelfParameter { span }
    }
}
