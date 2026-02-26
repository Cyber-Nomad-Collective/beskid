use crate::syntax::Spanned;

use super::expression::ExpressionNode;
use super::pattern::HirPattern;
use super::phase::HirPhase;

pub struct HirMatchArm {
    pub pattern: Spanned<HirPattern>,
    pub guard: Option<Spanned<ExpressionNode<HirPhase>>>,
    pub value: Spanned<ExpressionNode<HirPhase>>,
}
