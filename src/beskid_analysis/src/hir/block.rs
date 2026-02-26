use crate::syntax::Spanned;

use super::phase::HirPhase;
use super::statement::StatementNode;

pub struct HirBlock {
    pub statements: Vec<Spanned<StatementNode<HirPhase>>>,
}
