use crate::syntax::Spanned;

use super::expression::ExpressionNode;
use super::phase::HirPhase;

pub struct HirRangeExpression {
    pub start: Spanned<ExpressionNode<HirPhase>>,
    pub end: Spanned<ExpressionNode<HirPhase>>,
}
