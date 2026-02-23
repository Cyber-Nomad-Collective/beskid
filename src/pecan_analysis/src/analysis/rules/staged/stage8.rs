use super::SemanticPipelineRule;
use crate::analysis::rules::RuleContext;
use crate::hir::AstProgram;
use crate::syntax::Spanned;

impl SemanticPipelineRule {
    pub(super) fn stage8_metaprogramming(&self, _ctx: &mut RuleContext, _hir: &Spanned<AstProgram>) {
        // Grammar v0.1 does not expose macro invocation/definition nodes yet.
        // Rule hooks are in place for E1801/E1802/E1803/E1804 when macro syntax lands.
    }
}
