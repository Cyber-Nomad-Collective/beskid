use super::SemanticPipelineRule;
use crate::analysis::Severity;
use crate::analysis::rules::{resolve, RuleContext};
use crate::hir::{
    validate_hir_program, HirBlock, HirExpressionNode, HirItem, HirLegalityError, HirPath,
    HirProgram, HirStatementNode,
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
            let Some(previous_span) = seen.insert(imported_name.clone(), use_decl.node.path.span) else {
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
                        known_roots.insert(segment.node.name.clone());
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
            if known_roots.contains(&root.node.name) {
                continue;
            }

            ctx.emit_simple(
                use_decl.node.path.span,
                "E1105",
                format!("unknown import path `{}`", self.path_to_string_local(&use_decl.node.path)),
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
                HirStatementNode::WhileStatement(while_statement) => {
                    self.check_expr_use_before_decl(
                        ctx,
                        &while_statement.node.condition,
                        declared_stack,
                        &pending,
                    );
                    self.check_block_use_before_decl(ctx, &while_statement.node.body, declared_stack);
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
        match &expression.node {
            HirExpressionNode::PathExpression(path_expr) => {
                if path_expr.node.path.node.segments.len() != 1 {
                    return;
                }
                let Some(name) = path_expr.node.path.node.segments.first() else {
                    return;
                };
                if declared_stack.iter().any(|declared| declared == &name.node.name) {
                    return;
                }
                if !pending.contains(&name.node.name) {
                    return;
                }
                ctx.emit_simple(
                    path_expr.node.path.span,
                    "E1106",
                    format!("use of `{}` before declaration", name.node.name),
                    "use before declaration",
                    None,
                    Severity::Error,
                );
            }
            HirExpressionNode::AssignExpression(assign_expression) => {
                self.check_expr_use_before_decl(
                    ctx,
                    &assign_expression.node.target,
                    declared_stack,
                    pending,
                );
                self.check_expr_use_before_decl(
                    ctx,
                    &assign_expression.node.value,
                    declared_stack,
                    pending,
                );
            }
            HirExpressionNode::BinaryExpression(binary_expression) => {
                self.check_expr_use_before_decl(ctx, &binary_expression.node.left, declared_stack, pending);
                self.check_expr_use_before_decl(ctx, &binary_expression.node.right, declared_stack, pending);
            }
            HirExpressionNode::UnaryExpression(unary_expression) => {
                self.check_expr_use_before_decl(ctx, &unary_expression.node.expr, declared_stack, pending);
            }
            HirExpressionNode::CallExpression(call_expression) => {
                self.check_expr_use_before_decl(ctx, &call_expression.node.callee, declared_stack, pending);
                for arg in &call_expression.node.args {
                    self.check_expr_use_before_decl(ctx, arg, declared_stack, pending);
                }
            }
            HirExpressionNode::MemberExpression(member_expression) => {
                self.check_expr_use_before_decl(ctx, &member_expression.node.target, declared_stack, pending);
            }
            HirExpressionNode::StructLiteralExpression(struct_literal) => {
                for field in &struct_literal.node.fields {
                    self.check_expr_use_before_decl(ctx, &field.node.value, declared_stack, pending);
                }
            }
            HirExpressionNode::EnumConstructorExpression(constructor_expression) => {
                for arg in &constructor_expression.node.args {
                    self.check_expr_use_before_decl(ctx, arg, declared_stack, pending);
                }
            }
            HirExpressionNode::MatchExpression(match_expression) => {
                self.check_expr_use_before_decl(
                    ctx,
                    &match_expression.node.scrutinee,
                    declared_stack,
                    pending,
                );
                for arm in &match_expression.node.arms {
                    if let Some(guard) = &arm.node.guard {
                        self.check_expr_use_before_decl(ctx, guard, declared_stack, pending);
                    }
                    self.check_expr_use_before_decl(ctx, &arm.node.value, declared_stack, pending);
                }
            }
            HirExpressionNode::BlockExpression(block_expression) => {
                self.check_block_use_before_decl(ctx, &block_expression.node.block, &mut declared_stack.to_vec());
            }
            HirExpressionNode::GroupedExpression(grouped_expression) => {
                self.check_expr_use_before_decl(ctx, &grouped_expression.node.expr, declared_stack, pending);
            }
            HirExpressionNode::LiteralExpression(_) => {}
        }
    }

    fn path_tail_local(&self, path: &Spanned<HirPath>) -> String {
        path.node
            .segments
            .last()
            .map(|segment| segment.node.name.clone())
            .unwrap_or_default()
    }

    fn path_to_string_local(&self, path: &Spanned<HirPath>) -> String {
        path.node
            .segments
            .iter()
            .map(|segment| segment.node.name.clone())
            .collect::<Vec<_>>()
            .join(".")
    }
}
