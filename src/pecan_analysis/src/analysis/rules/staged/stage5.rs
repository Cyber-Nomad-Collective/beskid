use super::SemanticPipelineRule;
use crate::analysis::Severity;
use crate::analysis::rules::RuleContext;
use crate::hir::{AstItem, AstProgram};
use crate::syntax::{Block, Expression, Path, Spanned, Statement, Visibility};
use std::collections::{HashMap, HashSet};
use std::path::PathBuf;

impl SemanticPipelineRule {
    pub(super) fn stage5_modules_and_visibility(&self, ctx: &mut RuleContext, hir: &Spanned<AstProgram>) {
        self.check_module_not_found(ctx, hir);
        self.check_visibility_violations(ctx, hir);
        self.check_unused_imports(ctx, hir);
        self.check_unused_private_items(ctx, hir);
    }

    fn check_module_not_found(&self, ctx: &mut RuleContext, hir: &Spanned<AstProgram>) {
        let source = PathBuf::from(ctx.source_name());
        let Some(parent) = source.parent() else {
            return;
        };

        for item in &hir.node.items {
            let AstItem::ModuleDeclaration(module) = &item.node else {
                continue;
            };
            let module_path = self.path_to_string_stage5(&module.node.path).replace('.', "/");
            let file_candidate = parent.join(format!("{module_path}.pn"));
            let mod_candidate = parent.join(module_path).join("mod.pn");
            if file_candidate.exists() || mod_candidate.exists() {
                continue;
            }

            ctx.emit_simple(
                module.node.path.span,
                "E1502",
                format!("module `{}` not found", self.path_to_string_stage5(&module.node.path)),
                "module not found",
                Some(format!(
                    "expected `{}` or `{}`",
                    file_candidate.display(),
                    mod_candidate.display()
                )),
                Severity::Error,
            );
        }
    }

    fn check_visibility_violations(&self, ctx: &mut RuleContext, hir: &Spanned<AstProgram>) {
        let private_items = self.collect_private_item_spans(hir);

        for item in &hir.node.items {
            let AstItem::UseDeclaration(use_decl) = &item.node else {
                continue;
            };
            if use_decl.node.path.node.segments.len() < 2 {
                continue;
            }
            let tail = self.path_tail_stage5(&use_decl.node.path);
            let Some(private_span) = private_items.get(&tail) else {
                continue;
            };
            let root = &use_decl.node.path.node.segments[0].node.name;
            if root == &tail {
                continue;
            }

            ctx.emit_simple(
                use_decl.node.path.span,
                "E1501",
                format!("visibility violation while importing private item `{tail}`"),
                "visibility violation",
                Some(format!(
                    "item is private (declared at line {}, column {})",
                    private_span.line_col_start.0, private_span.line_col_start.1
                )),
                Severity::Error,
            );
        }
    }

    fn check_unused_imports(&self, ctx: &mut RuleContext, hir: &Spanned<AstProgram>) {
        let used_names = self.collect_used_value_names(hir);

        for item in &hir.node.items {
            let AstItem::UseDeclaration(use_decl) = &item.node else {
                continue;
            };
            let imported_name = self.path_tail_stage5(&use_decl.node.path);
            if used_names.contains(&imported_name) {
                continue;
            }
            ctx.emit_simple(
                use_decl.node.path.span,
                "W1503",
                format!("unused import `{}`", self.path_to_string_stage5(&use_decl.node.path)),
                "unused import",
                None,
                Severity::Warning,
            );
        }
    }

    fn check_unused_private_items(&self, ctx: &mut RuleContext, hir: &Spanned<AstProgram>) {
        let used_names = self.collect_used_value_names(hir);

        for item in &hir.node.items {
            let (name, visibility, span) = match &item.node {
                AstItem::FunctionDefinition(definition) => (
                    definition.node.name.node.name.clone(),
                    definition.node.visibility.node,
                    definition.node.name.span,
                ),
                AstItem::TypeDefinition(definition) => (
                    definition.node.name.node.name.clone(),
                    definition.node.visibility.node,
                    definition.node.name.span,
                ),
                AstItem::EnumDefinition(definition) => (
                    definition.node.name.node.name.clone(),
                    definition.node.visibility.node,
                    definition.node.name.span,
                ),
                AstItem::ContractDefinition(definition) => (
                    definition.node.name.node.name.clone(),
                    definition.node.visibility.node,
                    definition.node.name.span,
                ),
                AstItem::ModuleDeclaration(definition) => (
                    self.path_tail_stage5(&definition.node.path),
                    definition.node.visibility.node,
                    definition.node.path.span,
                ),
                _ => continue,
            };

            if visibility == Visibility::Public || name == "main" || used_names.contains(&name) {
                continue;
            }

            ctx.emit_simple(
                span,
                "W1504",
                format!("unused private item `{name}`"),
                "unused private item",
                None,
                Severity::Warning,
            );
        }
    }

    fn collect_private_item_spans(&self, hir: &Spanned<AstProgram>) -> HashMap<String, crate::syntax::SpanInfo> {
        let mut items = HashMap::new();
        for item in &hir.node.items {
            match &item.node {
                AstItem::FunctionDefinition(definition) if definition.node.visibility.node == Visibility::Private => {
                    items.insert(definition.node.name.node.name.clone(), definition.node.name.span);
                }
                AstItem::TypeDefinition(definition) if definition.node.visibility.node == Visibility::Private => {
                    items.insert(definition.node.name.node.name.clone(), definition.node.name.span);
                }
                AstItem::EnumDefinition(definition) if definition.node.visibility.node == Visibility::Private => {
                    items.insert(definition.node.name.node.name.clone(), definition.node.name.span);
                }
                AstItem::ContractDefinition(definition)
                    if definition.node.visibility.node == Visibility::Private =>
                {
                    items.insert(definition.node.name.node.name.clone(), definition.node.name.span);
                }
                _ => {}
            }
        }
        items
    }

    fn collect_used_value_names(&self, hir: &Spanned<AstProgram>) -> HashSet<String> {
        let mut used = HashSet::new();
        for item in &hir.node.items {
            match &item.node {
                AstItem::FunctionDefinition(definition) => {
                    self.collect_used_in_block(&definition.node.body, &mut used);
                }
                AstItem::MethodDefinition(definition) => {
                    self.collect_used_in_block(&definition.node.body, &mut used);
                }
                _ => {}
            }
        }
        used
    }

    fn collect_used_in_block(&self, block: &Spanned<Block>, used: &mut HashSet<String>) {
        for statement in &block.node.statements {
            match &statement.node {
                Statement::Let(let_statement) => {
                    self.collect_used_in_expression(&let_statement.node.value, used);
                }
                Statement::Return(return_statement) => {
                    if let Some(value) = &return_statement.node.value {
                        self.collect_used_in_expression(value, used);
                    }
                }
                Statement::While(while_statement) => {
                    self.collect_used_in_expression(&while_statement.node.condition, used);
                    self.collect_used_in_block(&while_statement.node.body, used);
                }
                Statement::For(for_statement) => {
                    self.collect_used_in_expression(&for_statement.node.range.node.start, used);
                    self.collect_used_in_expression(&for_statement.node.range.node.end, used);
                    self.collect_used_in_block(&for_statement.node.body, used);
                }
                Statement::If(if_statement) => {
                    self.collect_used_in_expression(&if_statement.node.condition, used);
                    self.collect_used_in_block(&if_statement.node.then_block, used);
                    if let Some(else_block) = &if_statement.node.else_block {
                        self.collect_used_in_block(else_block, used);
                    }
                }
                Statement::Expression(expression_statement) => {
                    self.collect_used_in_expression(&expression_statement.node.expression, used);
                }
                Statement::Break(_) | Statement::Continue(_) => {}
            }
        }
    }

    fn collect_used_in_expression(&self, expression: &Spanned<Expression>, used: &mut HashSet<String>) {
        match &expression.node {
            Expression::Path(path_expression) => {
                if let Some(last) = path_expression.node.path.node.segments.last() {
                    used.insert(last.node.name.clone());
                }
            }
            Expression::Assign(assign_expression) => {
                self.collect_used_in_expression(&assign_expression.node.target, used);
                self.collect_used_in_expression(&assign_expression.node.value, used);
            }
            Expression::Binary(binary_expression) => {
                self.collect_used_in_expression(&binary_expression.node.left, used);
                self.collect_used_in_expression(&binary_expression.node.right, used);
            }
            Expression::Unary(unary_expression) => {
                self.collect_used_in_expression(&unary_expression.node.expr, used);
            }
            Expression::Call(call_expression) => {
                self.collect_used_in_expression(&call_expression.node.callee, used);
                for arg in &call_expression.node.args {
                    self.collect_used_in_expression(arg, used);
                }
            }
            Expression::Member(member_expression) => {
                self.collect_used_in_expression(&member_expression.node.target, used);
                used.insert(member_expression.node.member.node.name.clone());
            }
            Expression::StructLiteral(struct_literal) => {
                for field in &struct_literal.node.fields {
                    self.collect_used_in_expression(&field.node.value, used);
                }
            }
            Expression::EnumConstructor(constructor_expression) => {
                used.insert(constructor_expression.node.path.node.type_name.node.name.clone());
                used.insert(constructor_expression.node.path.node.variant.node.name.clone());
                for arg in &constructor_expression.node.args {
                    self.collect_used_in_expression(arg, used);
                }
            }
            Expression::Match(match_expression) => {
                self.collect_used_in_expression(&match_expression.node.scrutinee, used);
                for arm in &match_expression.node.arms {
                    if let Some(guard) = &arm.node.guard {
                        self.collect_used_in_expression(guard, used);
                    }
                    self.collect_used_in_expression(&arm.node.value, used);
                }
            }
            Expression::Block(block_expression) => self.collect_used_in_block(&block_expression.node.block, used),
            Expression::Grouped(grouped_expression) => {
                self.collect_used_in_expression(&grouped_expression.node.expr, used)
            }
            Expression::Literal(_) => {}
        }
    }

    fn path_tail_stage5(&self, path: &Spanned<Path>) -> String {
        path.node
            .segments
            .last()
            .map(|segment| segment.node.name.clone())
            .unwrap_or_default()
    }

    fn path_to_string_stage5(&self, path: &Spanned<Path>) -> String {
        path.node
            .segments
            .iter()
            .map(|segment| segment.node.name.clone())
            .collect::<Vec<_>>()
            .join(".")
    }
}
