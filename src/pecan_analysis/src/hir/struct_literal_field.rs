use crate::syntax::Spanned;

use super::common::HirIdentifier;
use super::expression::ExpressionNode;
use super::phase::HirPhase;

pub struct HirStructLiteralField {
    pub name: Spanned<HirIdentifier>,
    pub value: Spanned<ExpressionNode<HirPhase>>,
}
