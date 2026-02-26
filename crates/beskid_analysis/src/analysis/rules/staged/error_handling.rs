use super::SemanticPipelineRule;
use crate::analysis::rules::RuleContext;
use crate::hir::HirProgram;
use crate::syntax::Spanned;

impl SemanticPipelineRule {
    pub(super) fn stage7_error_handling(&self, _ctx: &mut RuleContext, _hir: &Spanned<HirProgram>) {
        // Grammar v0.1 does not expose question operator yet.
        // Rule hooks are in place for E1701/E1702/E1703 when syntax support lands.
    }
}
