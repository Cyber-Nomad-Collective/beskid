use super::SemanticPipelineRule;
use crate::analysis::diagnostic_kinds::SemanticIssueKind;
use crate::analysis::rules::{RuleContext, resolve};
use crate::hir::{
    HirBlock, HirExpressionNode, HirForStatement, HirItem, HirLegalityError, HirLetStatement,
    HirPath, HirProgram, HirStatementNode, validate_hir_program,
};
use crate::query::{HirNodeKind, HirNodeRef, HirVisit, HirWalker};
use crate::resolve::{Resolution, Resolver};
use crate::syntax::{SpanInfo, Spanned};
use std::collections::{HashMap, HashSet};

impl SemanticPipelineRule {
    pub(super) fn stage1_name_resolution(
        &self,
        ctx: &mut RuleContext,
        hir: &Spanned<HirProgram>,
    ) -> Option<Resolution> {
        self.check_ambiguous_imports(ctx, hir);
        self.check_unknown_import_paths(ctx, hir);
        self.check_use_before_declaration(ctx, hir);

        let mut resolver = Resolver::new();
        let resolution = match resolver.resolve_program(hir) {
            Ok(resolution) => resolution,
            Err(errors) => {
                for error in errors {
                    resolve::emit_resolve_error(ctx, error);
                }
                return None;
            }
        };

        for warning in &resolution.warnings {
            resolve::emit_resolve_warning(ctx, warning);
        }

        let legality_errors = validate_hir_program(hir, &resolution);
        if !legality_errors.is_empty() {
            for error in legality_errors {
                self.emit_legality_error(ctx, error);
            }
            return None;
        }

        Some(resolution)
    }

    fn emit_legality_error(&self, ctx: &mut RuleContext, error: HirLegalityError) {
        match error {
            HirLegalityError::InvalidSpan { span, context } => {
                ctx.emit_issue(
                    span,
                    SemanticIssueKind::InvalidHirSpan {
                        context: context.to_string(),
                    },
                );
            }
            HirLegalityError::UnresolvedValuePath { span } => {
                ctx.emit_issue(span, SemanticIssueKind::UnresolvedHirValuePath);
            }
            HirLegalityError::UnresolvedTypePath { span } => {
                ctx.emit_issue(span, SemanticIssueKind::UnresolvedHirTypePath);
            }
            HirLegalityError::NonNormalizedControlFlow { span, message } => {
                ctx.emit_issue(
                    span,
                    SemanticIssueKind::NonNormalizedHirControlFlow {
                        message: message.to_string(),
                    },
                );
            }
            HirLegalityError::DuplicateAttributeTarget { span, name, .. } => {
                ctx.emit_issue(
                    span,
                    SemanticIssueKind::InvalidHirSpan {
                        context: format!("duplicate attribute target `{name}`"),
                    },
                );
            }
            HirLegalityError::UnknownAttributeTarget { span, name } => {
                ctx.emit_issue(
                    span,
                    SemanticIssueKind::InvalidHirSpan {
                        context: format!("unknown attribute target `{name}`"),
                    },
                );
            }
            HirLegalityError::AttributeTargetNotAllowed {
                span,
                name,
                target,
                allowed,
            } => {
                ctx.emit_issue(
                    span,
                    SemanticIssueKind::InvalidHirSpan {
                        context: format!(
                            "attribute `{name}` cannot target `{target}` (allowed: {})",
                            allowed.join(", ")
                        ),
                    },
                );
            }
        }
    }

    fn check_ambiguous_imports(&self, ctx: &mut RuleContext, hir: &Spanned<HirProgram>) {
        let mut seen: HashMap<String, SpanInfo> = HashMap::new();

        for item in &hir.node.items {
            let HirItem::UseDeclaration(use_decl) = &item.node else {
                continue;
            };
            let imported_name = self.path_tail_local(&use_decl.node.path);
            let Some(previous_span) = seen.insert(imported_name.clone(), use_decl.node.path.span)
            else {
                continue;
            };

            ctx.emit_issue(
                use_decl.node.path.span,
                SemanticIssueKind::AmbiguousImport {
                    name: imported_name,
                    previous: previous_span,
                },
            );
        }
    }

    fn check_unknown_import_paths(&self, ctx: &mut RuleContext, hir: &Spanned<HirProgram>) {
        let mut known_roots = HashSet::new();
        known_roots.insert("std".to_string());
        for item in &hir.node.items {
            match &item.node {
                HirItem::ModuleDeclaration(module_decl) => {
                    if let Some(segment) = module_decl.node.path.node.segments.first() {
                        known_roots.insert(segment.node.name.node.name.clone());
                    }
                }
                HirItem::FunctionDefinition(def) => {
                    known_roots.insert(def.node.name.node.name.clone());
                }
                HirItem::TypeDefinition(def) => {
                    known_roots.insert(def.node.name.node.name.clone());
                }
                HirItem::EnumDefinition(def) => {
                    known_roots.insert(def.node.name.node.name.clone());
                }
                HirItem::ContractDefinition(def) => {
                    known_roots.insert(def.node.name.node.name.clone());
                }
                _ => {}
            }
        }

        for item in &hir.node.items {
            let HirItem::UseDeclaration(use_decl) = &item.node else {
                continue;
            };
            let Some(root) = use_decl.node.path.node.segments.first() else {
                continue;
            };
            if known_roots.contains(&root.node.name.node.name) {
                continue;
            }

            ctx.emit_issue(
                use_decl.node.path.span,
                SemanticIssueKind::UnknownImportPath {
                    path: self.path_to_string_local(&use_decl.node.path),
                },
            );
        }
    }

    fn check_use_before_declaration(&self, ctx: &mut RuleContext, hir: &Spanned<HirProgram>) {
        let mut walker = HirWalker::new().with_visitor(Box::new(UseBeforeDeclVisitor::new(ctx)));

        for item in &hir.node.items {
            match &item.node {
                HirItem::FunctionDefinition(definition) => {
                    walker.walk(HirNodeRef::from(&definition.node.body.node));
                }
                HirItem::MethodDefinition(definition) => {
                    walker.walk(HirNodeRef::from(&definition.node.body.node));
                }
                _ => {}
            }
        }
    }

    fn path_tail_local(&self, path: &Spanned<HirPath>) -> String {
        path.node
            .segments
            .last()
            .map(|segment| segment.node.name.node.name.clone())
            .unwrap_or_default()
    }

    fn path_to_string_local(&self, path: &Spanned<HirPath>) -> String {
        path.node
            .segments
            .iter()
            .map(|segment| segment.node.name.node.name.clone())
            .collect::<Vec<_>>()
            .join(".")
    }
}

struct DeclFrame {
    pending: HashSet<String>,
    start_declared_len: usize,
}

struct UseBeforeDeclVisitor<'a> {
    ctx: &'a mut RuleContext,
    declared_stack: Vec<String>,
    block_frames: Vec<DeclFrame>,
    kind_stack: Vec<HirNodeKind>,
    for_iterators: Vec<String>,
}

impl<'a> UseBeforeDeclVisitor<'a> {
    fn new(ctx: &'a mut RuleContext) -> Self {
        Self {
            ctx,
            declared_stack: Vec::new(),
            block_frames: Vec::new(),
            kind_stack: Vec::new(),
            for_iterators: Vec::new(),
        }
    }
}

impl HirVisit for UseBeforeDeclVisitor<'_> {
    fn enter(&mut self, node: HirNodeRef<'_>) {
        let parent = self.kind_stack.last().copied();

        if let Some(for_statement) = node.of::<HirForStatement>() {
            self.for_iterators
                .push(for_statement.iterator.node.name.clone());
        }

        if let Some(block) = node.of::<HirBlock>() {
            let pending = block
                .statements
                .iter()
                .filter_map(|statement| match &statement.node {
                    HirStatementNode::LetStatement(let_statement) => {
                        Some(let_statement.node.name.node.name.clone())
                    }
                    _ => None,
                })
                .collect::<HashSet<_>>();

            let start_declared_len = self.declared_stack.len();
            self.block_frames.push(DeclFrame {
                pending,
                start_declared_len,
            });

            if parent == Some(HirNodeKind::ForStatement)
                && let Some(iterator_name) = self.for_iterators.last().cloned()
            {
                self.declared_stack.push(iterator_name);
            }
        }

        if let Some(expression) = node.of::<HirExpressionNode>()
            && let HirExpressionNode::PathExpression(path_expr) = expression
            && path_expr.node.path.node.segments.len() == 1
            && let Some(name) = path_expr.node.path.node.segments.first()
        {
            let name_value = &name.node.name.node.name;
            if let Some(frame) = self.block_frames.last()
                && !self
                    .declared_stack
                    .iter()
                    .any(|declared| declared == name_value)
                && frame.pending.contains(name_value)
            {
                self.ctx.emit_issue(
                    path_expr.node.path.span,
                    SemanticIssueKind::UseBeforeDeclaration {
                        name: name_value.clone(),
                    },
                );
            }
        }

        self.kind_stack.push(node.node_kind());
    }

    fn exit(&mut self, node: HirNodeRef<'_>) {
        if let Some(let_statement) = node.of::<HirLetStatement>() {
            let name = let_statement.name.node.name.clone();
            if let Some(frame) = self.block_frames.last_mut() {
                frame.pending.remove(&name);
            }
            self.declared_stack.push(name);
        }

        if node.of::<HirBlock>().is_some()
            && let Some(frame) = self.block_frames.pop()
        {
            self.declared_stack.truncate(frame.start_declared_len);
        }

        if node.of::<HirForStatement>().is_some() {
            self.for_iterators.pop();
        }

        self.kind_stack.pop();
    }
}
