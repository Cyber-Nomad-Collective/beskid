use std::collections::HashMap;

use crate::hir::{AstProgram, Item as HirItem};
use crate::syntax::{self, Spanned};

use super::errors::{ResolveError, ResolveResult};
use super::ids::{ItemId, LocalId, ModuleId};
use super::items::{ItemInfo, ItemKind};
use super::module_graph::ModuleGraph;
use super::tables::{ResolutionTables, ResolvedValue};

#[derive(Debug, Default)]
pub struct Resolver {
    items: Vec<ItemInfo>,
    symbols: HashMap<String, ItemId>,
    module_graph: ModuleGraph,
    current_module: ModuleId,
    tables: ResolutionTables,
    local_scopes: Vec<HashMap<String, LocalId>>,
    errors: Vec<ResolveError>,
}

impl Resolver {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn resolve_program(&mut self, program: &Spanned<AstProgram>) -> ResolveResult<Resolution> {
        self.current_module = self.module_graph.root();
        self.tables = ResolutionTables::new();
        self.local_scopes.clear();
        for item in &program.node.items {
            self.collect_item(item);
        }
        for item in &program.node.items {
            self.resolve_item(item);
        }

        if self.errors.is_empty() {
            Ok(Resolution {
                items: std::mem::take(&mut self.items),
                module_graph: std::mem::take(&mut self.module_graph),
                tables: std::mem::take(&mut self.tables),
            })
        } else {
            Err(std::mem::take(&mut self.errors))
        }
    }

    fn collect_item(&mut self, item: &Spanned<HirItem<crate::hir::AstPhase>>) {
        let (name, kind) = match &item.node {
            HirItem::FunctionDefinition(def) => (def.node.name.node.name.clone(), ItemKind::Function),
            HirItem::MethodDefinition(def) => (def.node.name.node.name.clone(), ItemKind::Method),
            HirItem::TypeDefinition(def) => (def.node.name.node.name.clone(), ItemKind::Type),
            HirItem::EnumDefinition(def) => (def.node.name.node.name.clone(), ItemKind::Enum),
            HirItem::ContractDefinition(def) => (def.node.name.node.name.clone(), ItemKind::Contract),
            HirItem::ModuleDeclaration(def) => (path_tail(&def.node.path), ItemKind::Module),
            HirItem::UseDeclaration(def) => (path_tail(&def.node.path), ItemKind::Use),
        };

        let id = ItemId(self.items.len());
        let module_id = self.current_module;
        if let Some(prev) = self.symbols.get(&name).copied() {
            let prev_span = self.items[prev.0].span;
            self.errors.push(ResolveError::DuplicateItem {
                name,
                span: item.span,
                previous: prev_span,
            });
            return;
        }

        self.symbols.insert(name.clone(), id);
        if let Some(prev) = self
            .module_graph
            .insert_item(module_id, name.clone(), id)
        {
            let prev_span = self.items[prev.0].span;
            self.errors.push(ResolveError::DuplicateItem {
                name,
                span: item.span,
                previous: prev_span,
            });
            return;
        }
        self.items.push(ItemInfo {
            id,
            name,
            kind,
            span: item.span,
        });

        if let HirItem::ModuleDeclaration(def) = &item.node {
            let module_path = def
                .node
                .path
                .node
                .segments
                .iter()
                .map(|segment| segment.node.name.clone())
                .collect::<Vec<_>>();
            self.module_graph.ensure_module_path(&module_path);
        }
    }

    fn resolve_item(&mut self, item: &Spanned<HirItem<crate::hir::AstPhase>>) {
        match &item.node {
            HirItem::FunctionDefinition(def) => {
                self.push_scope();
                for param in &def.node.parameters {
                    self.resolve_type(&param.node.ty);
                    self.insert_local(&param.node.name.node.name, param.node.name.span);
                }
                if let Some(return_type) = &def.node.return_type {
                    self.resolve_type(return_type);
                }
                self.resolve_block(&def.node.body);
                self.pop_scope();
            }
            HirItem::MethodDefinition(def) => {
                self.push_scope();
                self.resolve_type(&def.node.receiver_type);
                for param in &def.node.parameters {
                    self.resolve_type(&param.node.ty);
                    self.insert_local(&param.node.name.node.name, param.node.name.span);
                }
                if let Some(return_type) = &def.node.return_type {
                    self.resolve_type(return_type);
                }
                self.resolve_block(&def.node.body);
                self.pop_scope();
            }
            HirItem::TypeDefinition(def) => {
                for field in &def.node.fields {
                    self.resolve_type(&field.node.ty);
                }
            }
            HirItem::EnumDefinition(def) => {
                for variant in &def.node.variants {
                    for field in &variant.node.fields {
                        self.resolve_type(&field.node.ty);
                    }
                }
            }
            HirItem::ContractDefinition(def) => {
                for node in &def.node.items {
                    match &node.node {
                        syntax::ContractNode::MethodSignature(signature) => {
                            for param in &signature.node.parameters {
                                self.resolve_type(&param.node.ty);
                            }
                            if let Some(return_type) = &signature.node.return_type {
                                self.resolve_type(return_type);
                            }
                        }
                        syntax::ContractNode::Embedding(_) => {}
                    }
                }
            }
            HirItem::ModuleDeclaration(_) | HirItem::UseDeclaration(_) => {}
        }
    }

    fn resolve_block(&mut self, block: &Spanned<syntax::Block>) {
        self.push_scope();
        for statement in &block.node.statements {
            self.resolve_statement(statement);
        }
        self.pop_scope();
    }

    fn resolve_statement(&mut self, statement: &Spanned<syntax::Statement>) {
        match &statement.node {
            syntax::Statement::Let(let_stmt) => {
                if let Some(type_annotation) = &let_stmt.node.type_annotation {
                    self.resolve_type(type_annotation);
                }
                self.resolve_expression(&let_stmt.node.value);
                self.insert_local(&let_stmt.node.name.node.name, let_stmt.node.name.span);
            }
            syntax::Statement::Return(return_stmt) => {
                if let Some(value) = &return_stmt.node.value {
                    self.resolve_expression(value);
                }
            }
            syntax::Statement::Break(_) | syntax::Statement::Continue(_) => {}
            syntax::Statement::While(while_stmt) => {
                self.resolve_expression(&while_stmt.node.condition);
                self.resolve_block(&while_stmt.node.body);
            }
            syntax::Statement::For(for_stmt) => {
                self.resolve_range_expression(&for_stmt.node.range);
                self.push_scope();
                self.insert_local(&for_stmt.node.iterator.node.name, for_stmt.node.iterator.span);
                for stmt in &for_stmt.node.body.node.statements {
                    self.resolve_statement(stmt);
                }
                self.pop_scope();
            }
            syntax::Statement::If(if_stmt) => {
                self.resolve_expression(&if_stmt.node.condition);
                self.resolve_block(&if_stmt.node.then_block);
                if let Some(else_block) = &if_stmt.node.else_block {
                    self.resolve_block(else_block);
                }
            }
            syntax::Statement::Expression(expr_stmt) => {
                self.resolve_expression(&expr_stmt.node.expression);
            }
        }
    }

    fn resolve_range_expression(&mut self, range: &Spanned<syntax::RangeExpression>) {
        self.resolve_expression(&range.node.start);
        self.resolve_expression(&range.node.end);
    }

    fn resolve_expression(&mut self, expression: &Spanned<syntax::Expression>) {
        match &expression.node {
            syntax::Expression::Match(match_expr) => {
                self.resolve_expression(&match_expr.node.scrutinee);
                for arm in &match_expr.node.arms {
                    self.resolve_match_arm(arm);
                }
            }
            syntax::Expression::Assign(assign_expr) => {
                self.resolve_expression(&assign_expr.node.target);
                self.resolve_expression(&assign_expr.node.value);
            }
            syntax::Expression::Binary(binary_expr) => {
                self.resolve_expression(&binary_expr.node.left);
                self.resolve_expression(&binary_expr.node.right);
            }
            syntax::Expression::Unary(unary_expr) => {
                self.resolve_expression(&unary_expr.node.expr);
            }
            syntax::Expression::Call(call_expr) => {
                self.resolve_expression(&call_expr.node.callee);
                for arg in &call_expr.node.args {
                    self.resolve_expression(arg);
                }
            }
            syntax::Expression::Member(member_expr) => {
                self.resolve_expression(&member_expr.node.target);
            }
            syntax::Expression::Literal(_) => {}
            syntax::Expression::Path(path_expr) => {
                self.resolve_value_path(&path_expr.node.path);
            }
            syntax::Expression::StructLiteral(literal) => {
                self.resolve_type_path(&literal.node.path);
                for field in &literal.node.fields {
                    self.resolve_struct_literal_field(field);
                }
            }
            syntax::Expression::EnumConstructor(constructor) => {
                self.resolve_enum_path(&constructor.node.path);
                for arg in &constructor.node.args {
                    self.resolve_expression(arg);
                }
            }
            syntax::Expression::Block(block_expr) => {
                self.resolve_block(&block_expr.node.block);
            }
            syntax::Expression::Grouped(grouped_expr) => {
                self.resolve_expression(&grouped_expr.node.expr);
            }
        }
    }

    fn resolve_match_arm(&mut self, arm: &Spanned<syntax::MatchArm>) {
        self.push_scope();
        self.resolve_pattern(&arm.node.pattern);
        if let Some(guard) = &arm.node.guard {
            self.resolve_expression(guard);
        }
        self.resolve_expression(&arm.node.value);
        self.pop_scope();
    }

    fn resolve_pattern(&mut self, pattern: &Spanned<syntax::Pattern>) {
        match &pattern.node {
            syntax::Pattern::Wildcard => {}
            syntax::Pattern::Identifier(identifier) => {
                self.insert_local(&identifier.node.name, identifier.span);
            }
            syntax::Pattern::Literal(_) => {}
            syntax::Pattern::Enum(enum_pattern) => {
                self.resolve_enum_path(&enum_pattern.node.path);
                for item in &enum_pattern.node.items {
                    self.resolve_pattern(item);
                }
            }
        }
    }

    fn resolve_struct_literal_field(&mut self, field: &Spanned<syntax::StructLiteralField>) {
        self.resolve_expression(&field.node.value);
    }

    fn resolve_type(&mut self, ty: &Spanned<syntax::Type>) {
        match &ty.node {
            syntax::Type::Primitive(_) => {}
            syntax::Type::Complex(path) => self.resolve_type_path(path),
            syntax::Type::Array(inner) | syntax::Type::Ref(inner) => self.resolve_type(inner),
        }
    }

    fn resolve_value_path(&mut self, path: &Spanned<syntax::Path>) {
        let name = path_tail(path);
        if let Some(local) = self.resolve_local(&name) {
            self.tables.insert_value(path.span, ResolvedValue::Local(local));
            return;
        }
        if let Some(item) = self.symbols.get(&name).copied() {
            self.tables.insert_value(path.span, ResolvedValue::Item(item));
            return;
        }
        self.errors.push(ResolveError::UnknownValue {
            name,
            span: path.span,
        });
    }

    fn resolve_type_path(&mut self, path: &Spanned<syntax::Path>) {
        let name = path_tail(path);
        if let Some(item) = self.symbols.get(&name).copied() {
            self.tables.insert_type(path.span, item);
            return;
        }
        self.errors.push(ResolveError::UnknownType {
            name,
            span: path.span,
        });
    }

    fn resolve_enum_path(&mut self, path: &Spanned<syntax::EnumPath>) {
        let type_name = path.node.type_name.node.name.clone();
        if let Some(item) = self.symbols.get(&type_name).copied() {
            self.tables.insert_type(path.span, item);
            return;
        }
        self.errors.push(ResolveError::UnknownType {
            name: type_name,
            span: path.span,
        });
    }

    fn resolve_local(&self, name: &str) -> Option<LocalId> {
        for scope in self.local_scopes.iter().rev() {
            if let Some(local) = scope.get(name).copied() {
                return Some(local);
            }
        }
        None
    }

    fn insert_local(&mut self, name: &str, span: syntax::SpanInfo) {
        let scope = match self.local_scopes.last_mut() {
            Some(scope) => scope,
            None => return,
        };
        if let Some(prev) = scope.get(name).copied() {
            let previous = self
                .tables
                .local_info(prev)
                .map(|info| info.span)
                .unwrap_or(span);
            self.errors.push(ResolveError::DuplicateLocal {
                name: name.to_string(),
                span,
                previous,
            });
            return;
        }
        let id = self.tables.intern_local(name.to_string(), span);
        scope.insert(name.to_string(), id);
    }

    fn push_scope(&mut self) {
        self.local_scopes.push(HashMap::new());
    }

    fn pop_scope(&mut self) {
        self.local_scopes.pop();
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Resolution {
    pub items: Vec<ItemInfo>,
    pub module_graph: ModuleGraph,
    pub tables: ResolutionTables,
}

fn path_tail(path: &Spanned<crate::syntax::Path>) -> String {
    path.node
        .segments
        .last()
        .map(|segment| segment.node.name.clone())
        .unwrap_or_else(|| "<unnamed>".to_string())
}
