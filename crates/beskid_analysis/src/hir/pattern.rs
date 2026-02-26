use crate::syntax::Spanned;

use super::common::{HirEnumPath, HirIdentifier};
use super::literal::HirLiteral;

pub enum HirPattern {
    Wildcard,
    Identifier(Spanned<HirIdentifier>),
    Literal(Spanned<HirLiteral>),
    Enum(Spanned<HirEnumPattern>),
}

pub struct HirEnumPattern {
    pub path: Spanned<HirEnumPath>,
    pub items: Vec<Spanned<HirPattern>>,
}
