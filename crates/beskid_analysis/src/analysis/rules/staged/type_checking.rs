use super::SemanticPipelineRule;
use crate::analysis::diagnostic_kinds::SemanticIssueKind;
use crate::analysis::rules::{RuleContext, types};
use crate::hir::{HirBlock, HirExpressionNode, HirForStatement, HirLetStatement, HirProgram};
use crate::query::{HirNodeKind, HirNodeRef, HirVisit, HirWalker};
use crate::resolve::Resolution;
use crate::syntax::Spanned;
use crate::types::type_program_with_errors;
use std::collections::HashMap;

impl SemanticPipelineRule {
    pub(super) fn stage2_type_check(
        &self,
        ctx: &mut RuleContext,
        hir: &Spanned<HirProgram>,
        resolution: &Resolution,
    ) {
        self.check_immutable_assignments(ctx, hir);

        let (typed, errors) = type_program_with_errors(hir, resolution);
        if errors.is_empty() {
            types::emit_cast_intent_warnings(ctx, &typed);
            return;
        }
        for error in errors {
            types::emit_type_error(ctx, error, Some(&typed));
        }
    }

    fn check_immutable_assignments(&self, ctx: &mut RuleContext, hir: &Spanned<HirProgram>) {
        let mut walker = HirWalker::new().with_visitor(Box::new(MutabilityVisitor::new(ctx)));

        for item in &hir.node.items {
            match &item.node {
                crate::hir::HirItem::FunctionDefinition(definition) => {
                    walker.walk(HirNodeRef::from(&definition.node.body.node));
                }
                crate::hir::HirItem::MethodDefinition(definition) => {
                    walker.walk(HirNodeRef::from(&definition.node.body.node));
                }
                _ => {}
            }
        }
    }
}

struct MutabilityVisitor<'a> {
    ctx: &'a mut RuleContext,
    scopes: Vec<HashMap<String, bool>>,
    kind_stack: Vec<HirNodeKind>,
    for_iterators: Vec<String>,
}

impl<'a> MutabilityVisitor<'a> {
    fn new(ctx: &'a mut RuleContext) -> Self {
        Self {
            ctx,
            scopes: Vec::new(),
            kind_stack: Vec::new(),
            for_iterators: Vec::new(),
        }
    }

    fn lookup_mutability(&self, name: &str) -> Option<bool> {
        for scope in self.scopes.iter().rev() {
            if let Some(value) = scope.get(name) {
                return Some(*value);
            }
        }
        None
    }
}

impl HirVisit for MutabilityVisitor<'_> {
    fn enter(&mut self, node: HirNodeRef<'_>) {
        let parent = self.kind_stack.last().copied();

        if let Some(for_statement) = node.of::<HirForStatement>() {
            self.for_iterators
                .push(for_statement.iterator.node.name.clone());
        }

        if node.of::<HirBlock>().is_some() {
            self.scopes.push(HashMap::new());
            if parent == Some(HirNodeKind::ForStatement)
                && let Some(iterator_name) = self.for_iterators.last().cloned()
                && let Some(scope) = self.scopes.last_mut()
            {
                scope.insert(iterator_name, false);
            }
        }

        if let Some(expression) = node.of::<HirExpressionNode>()
            && let HirExpressionNode::AssignExpression(assign_expression) = expression
            && let HirExpressionNode::PathExpression(path_expr) =
                &assign_expression.node.target.node
            && path_expr.node.path.node.segments.len() == 1
            && let Some(name) = path_expr.node.path.node.segments.first()
        {
            let name_value = &name.node.name.node.name;
            if let Some(is_mutable) = self.lookup_mutability(name_value)
                && !is_mutable
            {
                self.ctx.emit_issue(
                    assign_expression.node.target.span,
                    SemanticIssueKind::ImmutableAssignment {
                        name: name_value.clone(),
                    },
                );
            }
        }

        self.kind_stack.push(node.node_kind());
    }

    fn exit(&mut self, node: HirNodeRef<'_>) {
        if let Some(let_statement) = node.of::<HirLetStatement>()
            && let Some(scope) = self.scopes.last_mut()
        {
            scope.insert(let_statement.name.node.name.clone(), let_statement.mutable);
        }

        if node.of::<HirBlock>().is_some() {
            self.scopes.pop();
        }

        if node.of::<HirForStatement>().is_some() {
            self.for_iterators.pop();
        }

        self.kind_stack.pop();
    }
}
