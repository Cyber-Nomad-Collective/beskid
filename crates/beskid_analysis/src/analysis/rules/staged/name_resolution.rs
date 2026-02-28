use super::SemanticPipelineRule;
use crate::analysis::Severity;
use crate::analysis::rules::{RuleContext, resolve};
use crate::analysis::rules::staged::expression_walk::{ExprChild, visit_expression_children};
use crate::hir::{
    HirBlock, HirExpressionNode, HirItem, HirLegalityError, HirPath, HirProgram, HirStatementNode,
    validate_hir_program,
};
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
                ctx.emit_simple(
                    span,
                    "E1151",
                    format!("invalid span invariant in `{context}`"),
                    "invalid HIR span",
                    None,
                    Severity::Error,
                );
            }
            HirLegalityError::UnresolvedValuePath { span } => {
                ctx.emit_simple(
                    span,
                    "E1152",
                    "unresolved value path in HIR legality validation".to_string(),
                    "unresolved HIR value path",
                    None,
                    Severity::Error,
                );
            }
            HirLegalityError::UnresolvedTypePath { span } => {
                ctx.emit_simple(
                    span,
                    "E1153",
                    "unresolved type path in HIR legality validation".to_string(),
                    "unresolved HIR type path",
                    None,
                    Severity::Error,
                );
            }
            HirLegalityError::NonNormalizedControlFlow { span, message } => {
                ctx.emit_simple(
                    span,
                    "E1154",
                    format!("non-normalized control-flow in HIR: {message}"),
                    "non-normalized HIR control-flow",
                    None,
                    Severity::Error,
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

            let help = Some(format!(
                "previously imported at line {}, column {}",
                previous_span.line_col_start.0, previous_span.line_col_start.1
            ));
            ctx.emit_simple(
                use_decl.node.path.span,
                "E1104",
                format!("ambiguous import for `{imported_name}`"),
                "ambiguous import",
                help,
                Severity::Error,
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

            ctx.emit_simple(
                use_decl.node.path.span,
                "E1105",
                format!(
                    "unknown import path `{}`",
                    self.path_to_string_local(&use_decl.node.path)
                ),
                "unknown import path",
                None,
                Severity::Error,
            );
        }
    }

    fn check_use_before_declaration(&self, ctx: &mut RuleContext, hir: &Spanned<HirProgram>) {
        for item in &hir.node.items {
            match &item.node {
                HirItem::FunctionDefinition(definition) => {
                    self.check_block_use_before_decl(ctx, &definition.node.body, &mut Vec::new());
                }
                HirItem::MethodDefinition(definition) => {
                    self.check_block_use_before_decl(ctx, &definition.node.body, &mut Vec::new());
                }
                _ => {}
            }
        }
    }

    fn check_block_use_before_decl(
        &self,
        ctx: &mut RuleContext,
        block: &Spanned<HirBlock>,
        declared_stack: &mut Vec<String>,
    ) {
        let start_len = declared_stack.len();
        let mut pending: HashSet<String> = block
            .node
            .statements
            .iter()
            .filter_map(|statement| match &statement.node {
                HirStatementNode::LetStatement(let_statement) => {
                    Some(let_statement.node.name.node.name.clone())
                }
                _ => None,
            })
            .collect();

        for statement in &block.node.statements {
            match &statement.node {
                HirStatementNode::LetStatement(let_statement) => {
                    self.check_expr_use_before_decl(
                        ctx,
                        &let_statement.node.value,
                        declared_stack,
                        &pending,
                    );
                    pending.remove(&let_statement.node.name.node.name);
                    declared_stack.push(let_statement.node.name.node.name.clone());
                }
                HirStatementNode::ReturnStatement(return_statement) => {
                    if let Some(value) = &return_statement.node.value {
                        self.check_expr_use_before_decl(ctx, value, declared_stack, &pending);
                    }
                }
                HirStatementNode::ForStatement(for_statement) => {
                    self.check_expr_use_before_decl(
                        ctx,
                        &for_statement.node.range.node.start,
                        declared_stack,
                        &pending,
                    );
                    self.check_expr_use_before_decl(
                        ctx,
                        &for_statement.node.range.node.end,
                        declared_stack,
                        &pending,
                    );
                    declared_stack.push(for_statement.node.iterator.node.name.clone());
                    self.check_block_use_before_decl(ctx, &for_statement.node.body, declared_stack);
                    declared_stack.pop();
                }
                HirStatementNode::WhileStatement(while_statement) => {
                    self.check_expr_use_before_decl(
                        ctx,
                        &while_statement.node.condition,
                        declared_stack,
                        &pending,
                    );
                    self.check_block_use_before_decl(ctx, &while_statement.node.body, declared_stack);
                }
                HirStatementNode::IfStatement(if_statement) => {
                    self.check_expr_use_before_decl(
                        ctx,
                        &if_statement.node.condition,
                        declared_stack,
                        &pending,
                    );
                    self.check_block_use_before_decl(ctx, &if_statement.node.then_block, declared_stack);
                    if let Some(else_block) = &if_statement.node.else_block {
                        self.check_block_use_before_decl(ctx, else_block, declared_stack);
                    }
                }
                HirStatementNode::ExpressionStatement(expression_statement) => {
                    self.check_expr_use_before_decl(
                        ctx,
                        &expression_statement.node.expression,
                        declared_stack,
                        &pending,
                    );
                }
                HirStatementNode::BreakStatement(_) | HirStatementNode::ContinueStatement(_) => {}
            }
        }

        declared_stack.truncate(start_len);
    }

    fn check_expr_use_before_decl(
        &self,
        ctx: &mut RuleContext,
        expression: &Spanned<HirExpressionNode>,
        declared_stack: &[String],
        pending: &HashSet<String>,
    ) {
        if let HirExpressionNode::PathExpression(path_expr) = &expression.node {
            if path_expr.node.path.node.segments.len() == 1
                && let Some(name) = path_expr.node.path.node.segments.first()
            {
                let name_value = &name.node.name.node.name;
                if !declared_stack.iter().any(|declared| declared == name_value)
                    && pending.contains(name_value)
                {
                    ctx.emit_simple(
                        path_expr.node.path.span,
                        "E1106",
                        format!("use of `{}` before declaration", name_value),
                        "use before declaration",
                        None,
                        Severity::Error,
                    );
                }
            }
        }

        let mut on_child = |child: ExprChild<'_>| match child {
            ExprChild::Expr(child_expr) => {
                self.check_expr_use_before_decl(ctx, child_expr, declared_stack, pending)
            }
            ExprChild::Block(child_block) => {
                self.check_block_use_before_decl(ctx, child_block, &mut declared_stack.to_vec())
            }
        };
        visit_expression_children(expression, &mut on_child);
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
