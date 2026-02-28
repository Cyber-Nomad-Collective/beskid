use super::SemanticPipelineRule;
use crate::analysis::diagnostic_kinds::SemanticIssueKind;
use crate::analysis::rules::RuleContext;
use crate::hir::{HirExpressionNode, HirItem, HirPath, HirProgram, HirVisibility};
use crate::query::HirQuery;
use crate::syntax::Spanned;
use std::collections::{HashMap, HashSet};
use std::path::PathBuf;

impl SemanticPipelineRule {
    pub(super) fn stage5_modules_and_visibility(
        &self,
        ctx: &mut RuleContext,
        hir: &Spanned<HirProgram>,
    ) {
        self.check_module_not_found(ctx, hir);
        self.check_visibility_violations(ctx, hir);
        self.check_unused_imports(ctx, hir);
        self.check_unused_private_items(ctx, hir);
    }

    fn check_module_not_found(&self, ctx: &mut RuleContext, hir: &Spanned<HirProgram>) {
        let source = PathBuf::from(ctx.source_name());
        let Some(parent) = source.parent() else {
            return;
        };

        for item in &hir.node.items {
            let HirItem::ModuleDeclaration(module) = &item.node else {
                continue;
            };
            let module_path = self
                .path_to_string_stage5(&module.node.path)
                .replace('.', "/");
            let file_candidate = parent.join(format!("{module_path}.bd"));
            let mod_candidate = parent.join(module_path).join("mod.bd");
            if file_candidate.exists() || mod_candidate.exists() {
                continue;
            }

            ctx.emit_issue(
                module.node.path.span,
                SemanticIssueKind::VisibilityModuleNotFound {
                    module_path: self.path_to_string_stage5(&module.node.path),
                    file_candidate: file_candidate.display().to_string(),
                    mod_candidate: mod_candidate.display().to_string(),
                },
            );
        }
    }

    fn check_visibility_violations(&self, ctx: &mut RuleContext, hir: &Spanned<HirProgram>) {
        let private_items = self.collect_private_item_spans(hir);

        for item in &hir.node.items {
            let HirItem::UseDeclaration(use_decl) = &item.node else {
                continue;
            };
            if use_decl.node.path.node.segments.len() < 2 {
                continue;
            }
            let tail = self.path_tail_stage5(&use_decl.node.path);
            let Some(private_span) = private_items.get(&tail) else {
                continue;
            };
            let root = &use_decl.node.path.node.segments[0].node.name.node.name;
            if root == &tail {
                continue;
            }

            ctx.emit_issue(
                use_decl.node.path.span,
                SemanticIssueKind::VisibilityViolationImportPrivate {
                    name: tail,
                    private_span: *private_span,
                },
            );
        }
    }

    fn check_unused_imports(&self, ctx: &mut RuleContext, hir: &Spanned<HirProgram>) {
        let used_names = self.collect_used_value_names(hir);

        for item in &hir.node.items {
            let HirItem::UseDeclaration(use_decl) = &item.node else {
                continue;
            };
            let imported_name = self.path_tail_stage5(&use_decl.node.path);
            if used_names.contains(&imported_name) {
                continue;
            }
            ctx.emit_issue(
                use_decl.node.path.span,
                SemanticIssueKind::UnusedImport {
                    path: self.path_to_string_stage5(&use_decl.node.path),
                },
            );
        }
    }

    fn check_unused_private_items(&self, ctx: &mut RuleContext, hir: &Spanned<HirProgram>) {
        let used_names = self.collect_used_value_names(hir);

        for item in &hir.node.items {
            let (name, visibility, span) = match &item.node {
                HirItem::FunctionDefinition(definition) => (
                    definition.node.name.node.name.clone(),
                    definition.node.visibility.node,
                    definition.node.name.span,
                ),
                HirItem::TypeDefinition(definition) => (
                    definition.node.name.node.name.clone(),
                    definition.node.visibility.node,
                    definition.node.name.span,
                ),
                HirItem::EnumDefinition(definition) => (
                    definition.node.name.node.name.clone(),
                    definition.node.visibility.node,
                    definition.node.name.span,
                ),
                HirItem::ContractDefinition(definition) => (
                    definition.node.name.node.name.clone(),
                    definition.node.visibility.node,
                    definition.node.name.span,
                ),
                HirItem::ModuleDeclaration(definition) => (
                    self.path_tail_stage5(&definition.node.path),
                    definition.node.visibility.node,
                    definition.node.path.span,
                ),
                _ => continue,
            };

            if visibility == HirVisibility::Public || name == "main" || used_names.contains(&name) {
                continue;
            }

            ctx.emit_issue(span, SemanticIssueKind::UnusedPrivateItem { name });
        }
    }

    fn collect_private_item_spans(
        &self,
        hir: &Spanned<HirProgram>,
    ) -> HashMap<String, crate::syntax::SpanInfo> {
        let mut items = HashMap::new();
        for item in &hir.node.items {
            match &item.node {
                HirItem::FunctionDefinition(definition)
                    if definition.node.visibility.node == HirVisibility::Private =>
                {
                    items.insert(
                        definition.node.name.node.name.clone(),
                        definition.node.name.span,
                    );
                }
                HirItem::TypeDefinition(definition)
                    if definition.node.visibility.node == HirVisibility::Private =>
                {
                    items.insert(
                        definition.node.name.node.name.clone(),
                        definition.node.name.span,
                    );
                }
                HirItem::EnumDefinition(definition)
                    if definition.node.visibility.node == HirVisibility::Private =>
                {
                    items.insert(
                        definition.node.name.node.name.clone(),
                        definition.node.name.span,
                    );
                }
                HirItem::ContractDefinition(definition)
                    if definition.node.visibility.node == HirVisibility::Private =>
                {
                    items.insert(
                        definition.node.name.node.name.clone(),
                        definition.node.name.span,
                    );
                }
                _ => {}
            }
        }
        items
    }

    fn collect_used_value_names(&self, hir: &Spanned<HirProgram>) -> HashSet<String> {
        let mut used = HashSet::new();
        for item in &hir.node.items {
            match &item.node {
                HirItem::FunctionDefinition(definition) => {
                    for expression in
                        HirQuery::from(&definition.node.body.node).of::<HirExpressionNode>()
                    {
                        self.collect_used_from_expression(expression, &mut used);
                    }
                }
                HirItem::MethodDefinition(definition) => {
                    for expression in
                        HirQuery::from(&definition.node.body.node).of::<HirExpressionNode>()
                    {
                        self.collect_used_from_expression(expression, &mut used);
                    }
                }
                _ => {}
            }
        }
        used
    }

    fn collect_used_from_expression(
        &self,
        expression: &HirExpressionNode,
        used: &mut HashSet<String>,
    ) {
        match expression {
            HirExpressionNode::PathExpression(path_expression) => {
                if let Some(last) = path_expression.node.path.node.segments.last() {
                    used.insert(last.node.name.node.name.clone());
                }
            }
            HirExpressionNode::MemberExpression(member_expression) => {
                used.insert(member_expression.node.member.node.name.clone());
            }
            HirExpressionNode::EnumConstructorExpression(constructor_expression) => {
                used.insert(
                    constructor_expression
                        .node
                        .path
                        .node
                        .type_name
                        .node
                        .name
                        .clone(),
                );
                used.insert(
                    constructor_expression
                        .node
                        .path
                        .node
                        .variant
                        .node
                        .name
                        .clone(),
                );
            }
            _ => {}
        }
    }

    fn path_tail_stage5(&self, path: &Spanned<HirPath>) -> String {
        path.node
            .segments
            .last()
            .map(|segment| segment.node.name.node.name.clone())
            .unwrap_or_default()
    }

    fn path_to_string_stage5(&self, path: &Spanned<HirPath>) -> String {
        path.node
            .segments
            .iter()
            .map(|segment| segment.node.name.node.name.clone())
            .collect::<Vec<_>>()
            .join(".")
    }
}
