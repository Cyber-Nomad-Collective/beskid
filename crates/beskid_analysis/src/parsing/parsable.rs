use pest::iterators::Pair;

use crate::parser::Rule;
use crate::syntax::Spanned;

use super::error::ParseError;

pub trait Parsable: Sized {
    fn parse(pair: Pair<Rule>) -> Result<Spanned<Self>, ParseError>;
}
