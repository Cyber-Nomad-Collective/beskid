use std::collections::HashMap;

use crate::hir::{
    HirBlock, HirContractNode, HirEnumPath, HirExpressionNode, HirItem, HirPath, HirPattern,
    HirProgram, HirRangeExpression, HirStatementNode, HirStructLiteralField, HirType,
    HirVisibility,
};
use crate::syntax::{self, Spanned};

use super::errors::{ResolveError, ResolveResult, ResolveWarning};
use super::ids::{ItemId, LocalId, ModuleId};
use super::items::{ItemInfo, ItemKind};
use super::module_graph::ModuleGraph;
use super::tables::{ResolutionTables, ResolvedType, ResolvedValue};
use crate::builtins::builtin_specs;

#[derive(Debug, Default)]
pub struct Resolver {
    items: Vec<ItemInfo>,
    module_graph: ModuleGraph,
    current_module: ModuleId,
    tables: ResolutionTables,
    local_scopes: Vec<HashMap<String, LocalId>>,
    generic_scopes: Vec<HashMap<String, ()>>,
    errors: Vec<ResolveError>,
    warnings: Vec<ResolveWarning>,
    builtin_items: HashMap<ItemId, usize>,
}

impl Resolver {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn resolve_program(&mut self, program: &Spanned<HirProgram>) -> ResolveResult<Resolution> {
        self.current_module = self.module_graph.root();
        self.tables = ResolutionTables::new();
        self.local_scopes.clear();
        self.generic_scopes.clear();
        self.builtin_items.clear();
        self.collect_builtins();
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
                warnings: std::mem::take(&mut self.warnings),
                builtin_items: std::mem::take(&mut self.builtin_items),
            })
        } else {
            Err(std::mem::take(&mut self.errors))
        }
    }

    fn collect_builtins(&mut self) {
        for (index, spec) in builtin_specs().iter().enumerate() {
            let module_path: Vec<String> = spec
                .beskid_path
                .iter()
                .take(spec.beskid_path.len().saturating_sub(1))
                .map(|segment| (*segment).to_string())
                .collect();
            let module_id = self.module_graph.ensure_module_path(&module_path);
            let name = spec
                .beskid_path
                .last()
                .map(|segment| (*segment).to_string())
                .unwrap_or_else(|| "<builtin>".to_string());
            let id = ItemId(self.items.len());
            if let Some(prev) = self.module_graph.insert_item(module_id, name.clone(), id) {
                let prev_span = self.items[prev.0].span;
                self.errors.push(ResolveError::DuplicateItem {
                    name,
                    span: builtin_span(),
                    previous: prev_span,
                });
                continue;
            }
            self.items.push(ItemInfo {
                id,
                name,
                kind: ItemKind::Function,
                visibility: HirVisibility::Public,
                span: builtin_span(),
            });
            self.builtin_items.insert(id, index);
        }
    }

    fn collect_item(&mut self, item: &Spanned<HirItem>) {
        let (name, kind, visibility) = match &item.node {
            HirItem::FunctionDefinition(def) => (
                def.node.name.node.name.clone(),
                ItemKind::Function,
                def.node.visibility.node,
            ),
            HirItem::MethodDefinition(def) => (
                def.node.name.node.name.clone(),
                ItemKind::Method,
                def.node.visibility.node,
            ),
            HirItem::TypeDefinition(def) => (
                def.node.name.node.name.clone(),
                ItemKind::Type,
                def.node.visibility.node,
            ),
            HirItem::EnumDefinition(def) => (
                def.node.name.node.name.clone(),
                ItemKind::Enum,
                def.node.visibility.node,
            ),
            HirItem::ContractDefinition(def) => (
                def.node.name.node.name.clone(),
                ItemKind::Contract,
                def.node.visibility.node,
            ),
            HirItem::ModuleDeclaration(def) => (
                path_tail(&def.node.path),
                ItemKind::Module,
                def.node.visibility.node,
            ),
            HirItem::InlineModule(def) => (
                def.node.name.node.name.clone(),
                ItemKind::Module,
                def.node.visibility.node,
            ),
            HirItem::UseDeclaration(def) => (
                path_tail(&def.node.path),
                ItemKind::Use,
                def.node.visibility.node,
            ),
        };

        let id = ItemId(self.items.len());
        let module_id = match &item.node {
            HirItem::ModuleDeclaration(def) => {
                let segments: Vec<String> = def
                    .node
                    .path
                    .node
                    .segments
                    .iter()
                    .map(|segment| segment.node.name.node.name.clone())
                    .collect();
                let parent_path = &segments[..segments.len().saturating_sub(1)];
                self.module_graph.ensure_module_path(parent_path)
            }
            _ => self.current_module,
        };
        if let Some(prev) = self.module_graph.insert_item(module_id, name.clone(), id) {
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
            visibility,
            span: item.span,
        });

        if let HirItem::ModuleDeclaration(def) = &item.node {
            let module_path = def
                .node
                .path
                .node
                .segments
                .iter()
                .map(|segment| segment.node.name.node.name.clone())
                .collect::<Vec<_>>();
            self.module_graph.ensure_module_path(&module_path);
        }
        if let HirItem::InlineModule(def) = &item.node {
            let previous_module = self.current_module;
            let mut module_path = self
                .module_graph
                .module(self.current_module)
                .map(|module| module.path.clone())
                .unwrap_or_default();
            module_path.push(def.node.name.node.name.clone());
            let child_module = self.module_graph.ensure_module_path(&module_path);
            self.current_module = child_module;
            for nested in &def.node.items {
                self.collect_item(nested);
            }
            self.current_module = previous_module;
        }
    }

    fn resolve_item(&mut self, item: &Spanned<HirItem>) {
        match &item.node {
            HirItem::FunctionDefinition(def) => {
                self.push_generic_scope();
                for generic in &def.node.generics {
                    self.insert_generic(&generic.node.name);
                }
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
                self.pop_generic_scope();
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
            HirItem::InlineModule(def) => {
                self.push_scope();
                let previous_module = self.current_module;
                let mut module_path = self
                    .module_graph
                    .module(self.current_module)
                    .map(|module| module.path.clone())
                    .unwrap_or_default();
                module_path.push(def.node.name.node.name.clone());
                let child_id = self.module_graph.ensure_module_path(&module_path);
                self.current_module = child_id;
                for item in &def.node.items {
                    self.resolve_item(item);
                }
                self.current_module = previous_module;
                self.pop_scope();
            }
            HirItem::TypeDefinition(def) => {
                self.push_generic_scope();
                for generic in &def.node.generics {
                    self.insert_generic(&generic.node.name);
                }
                for field in &def.node.fields {
                    self.resolve_type(&field.node.ty);
                }
                self.pop_generic_scope();
            }
            HirItem::EnumDefinition(def) => {
                self.push_generic_scope();
                for generic in &def.node.generics {
                    self.insert_generic(&generic.node.name);
                }
                for variant in &def.node.variants {
                    for field in &variant.node.fields {
                        self.resolve_type(&field.node.ty);
                    }
                }
                self.pop_generic_scope();
            }
            HirItem::ContractDefinition(def) => {
                for node in &def.node.items {
                    match &node.node {
                        HirContractNode::MethodSignature(signature) => {
                            for param in &signature.node.parameters {
                                self.resolve_type(&param.node.ty);
                            }
                            if let Some(return_type) = &signature.node.return_type {
                                self.resolve_type(return_type);
                            }
                        }
                        HirContractNode::Embedding(_) => {}
                    }
                }
            }
            HirItem::ModuleDeclaration(_) | HirItem::UseDeclaration(_) => {}
        }
    }

    fn resolve_block(&mut self, block: &Spanned<HirBlock>) {
        self.push_scope();
        for statement in &block.node.statements {
            self.resolve_statement(statement);
        }
        self.pop_scope();
    }

    fn resolve_statement(&mut self, statement: &Spanned<HirStatementNode>) {
        match &statement.node {
            HirStatementNode::LetStatement(let_stmt) => {
                if let Some(type_annotation) = &let_stmt.node.type_annotation {
                    self.resolve_type(type_annotation);
                }
                self.resolve_expression(&let_stmt.node.value);
                self.insert_local(&let_stmt.node.name.node.name, let_stmt.node.name.span);
            }
            HirStatementNode::ReturnStatement(return_stmt) => {
                if let Some(value) = &return_stmt.node.value {
                    self.resolve_expression(value);
                }
            }
            HirStatementNode::BreakStatement(_) | HirStatementNode::ContinueStatement(_) => {}
            HirStatementNode::WhileStatement(while_stmt) => {
                self.resolve_expression(&while_stmt.node.condition);
                self.resolve_block(&while_stmt.node.body);
            }
            HirStatementNode::ForStatement(for_stmt) => {
                self.resolve_range_expression(&for_stmt.node.range);
                self.push_scope();
                self.insert_local(
                    &for_stmt.node.iterator.node.name,
                    for_stmt.node.iterator.span,
                );
                for stmt in &for_stmt.node.body.node.statements {
                    self.resolve_statement(stmt);
                }
                self.pop_scope();
            }
            HirStatementNode::IfStatement(if_stmt) => {
                self.resolve_expression(&if_stmt.node.condition);
                self.resolve_block(&if_stmt.node.then_block);
                if let Some(else_block) = &if_stmt.node.else_block {
                    self.resolve_block(else_block);
                }
            }
            HirStatementNode::ExpressionStatement(expr_stmt) => {
                self.resolve_expression(&expr_stmt.node.expression);
            }
        }
    }

    fn resolve_range_expression(&mut self, range: &Spanned<HirRangeExpression>) {
        self.resolve_expression(&range.node.start);
        self.resolve_expression(&range.node.end);
    }

    fn resolve_expression(&mut self, expression: &Spanned<HirExpressionNode>) {
        match &expression.node {
            HirExpressionNode::MatchExpression(match_expr) => {
                self.resolve_expression(&match_expr.node.scrutinee);
                for arm in &match_expr.node.arms {
                    self.resolve_match_arm(arm);
                }
            }
            HirExpressionNode::AssignExpression(assign_expr) => {
                self.resolve_expression(&assign_expr.node.target);
                self.resolve_expression(&assign_expr.node.value);
            }
            HirExpressionNode::BinaryExpression(binary_expr) => {
                self.resolve_expression(&binary_expr.node.left);
                self.resolve_expression(&binary_expr.node.right);
            }
            HirExpressionNode::UnaryExpression(unary_expr) => {
                self.resolve_expression(&unary_expr.node.expr);
            }
            HirExpressionNode::CallExpression(call_expr) => {
                self.resolve_expression(&call_expr.node.callee);
                for arg in &call_expr.node.args {
                    self.resolve_expression(arg);
                }
            }
            HirExpressionNode::MemberExpression(member_expr) => {
                self.resolve_expression(&member_expr.node.target);
            }
            HirExpressionNode::LiteralExpression(_) => {}
            HirExpressionNode::PathExpression(path_expr) => {
                self.resolve_value_path(&path_expr.node.path);
            }
            HirExpressionNode::StructLiteralExpression(literal) => {
                self.resolve_type_path(&literal.node.path);
                for field in &literal.node.fields {
                    self.resolve_struct_literal_field(field);
                }
            }
            HirExpressionNode::EnumConstructorExpression(constructor) => {
                self.resolve_enum_path(&constructor.node.path);
                for arg in &constructor.node.args {
                    self.resolve_expression(arg);
                }
            }
            HirExpressionNode::BlockExpression(block_expr) => {
                self.resolve_block(&block_expr.node.block);
            }
            HirExpressionNode::GroupedExpression(grouped_expr) => {
                self.resolve_expression(&grouped_expr.node.expr);
            }
        }
    }

    fn resolve_match_arm(&mut self, arm: &Spanned<crate::hir::HirMatchArm>) {
        self.push_scope();
        self.resolve_pattern(&arm.node.pattern);
        if let Some(guard) = &arm.node.guard {
            self.resolve_expression(guard);
        }
        self.resolve_expression(&arm.node.value);
        self.pop_scope();
    }

    fn resolve_pattern(&mut self, pattern: &Spanned<HirPattern>) {
        match &pattern.node {
            HirPattern::Wildcard => {}
            HirPattern::Identifier(identifier) => {
                self.insert_local(&identifier.node.name, identifier.span);
            }
            HirPattern::Literal(_) => {}
            HirPattern::Enum(enum_pattern) => {
                self.resolve_enum_path(&enum_pattern.node.path);
                for item in &enum_pattern.node.items {
                    self.resolve_pattern(item);
                }
            }
        }
    }

    fn resolve_struct_literal_field(&mut self, field: &Spanned<HirStructLiteralField>) {
        self.resolve_expression(&field.node.value);
    }

    fn resolve_type(&mut self, ty: &Spanned<HirType>) {
        match &ty.node {
            HirType::Primitive(_) => {}
            HirType::Complex(path) => self.resolve_type_path(path),
            HirType::Array(inner) | HirType::Ref(inner) => self.resolve_type(inner),
        }
    }

    fn resolve_value_path(&mut self, path: &Spanned<HirPath>) {
        let segments = path_segments(path);
        if segments.is_empty() {
            self.errors.push(ResolveError::UnknownValue {
                name: "<unnamed>".to_string(),
                span: path.span,
            });
            return;
        }
        if segments.len() == 1 {
            let name = &segments[0];
            if let Some(local) = self.resolve_local(name) {
                self.tables
                    .insert_value(path.span, ResolvedValue::Local(local));
                return;
            }
            if let Some(item) = self.resolve_item_in_scope(name) {
                self.tables
                    .insert_value(path.span, ResolvedValue::Item(item));
                return;
            }
            self.errors.push(ResolveError::UnknownValue {
                name: (*name).clone(),
                span: path.span,
            });
            return;
        }
        if let Some(local) = self.resolve_local(&segments[0]) {
            self.tables
                .insert_value(path.span, ResolvedValue::Local(local));
            return;
        }
        match self.resolve_item_in_module_path(&segments) {
            ModulePathLookup::Found(item) => {
                self.tables
                    .insert_value(path.span, ResolvedValue::Item(item));
            }
            ModulePathLookup::ModuleMissing => {
                self.errors.push(ResolveError::UnknownModulePath {
                    path: segments[..segments.len() - 1].join("::"),
                    span: path.span,
                });
            }
            ModulePathLookup::NameMissing { module_path, name } => {
                self.errors.push(ResolveError::UnknownValueInModule {
                    module_path,
                    name,
                    span: path.span,
                });
            }
            ModulePathLookup::NotVisible { module_path, name } => {
                self.errors.push(ResolveError::PrivateItemInModule {
                    module_path,
                    name,
                    span: path.span,
                });
            }
        }
    }

    fn resolve_type_path(&mut self, path: &Spanned<HirPath>) {
        let segments = path_segments(path);
        if segments.is_empty() {
            self.errors.push(ResolveError::UnknownType {
                name: "<unnamed>".to_string(),
                span: path.span,
            });
            return;
        }
        if segments.len() == 1 {
            let name = &segments[0];
            if self.is_generic(name) {
                self.tables
                    .insert_type(path.span, ResolvedType::Generic(name.clone()));
                return;
            }
            if let Some(item) = self.resolve_item_in_scope(name) {
                self.tables.insert_type(path.span, ResolvedType::Item(item));
                return;
            }
            self.errors.push(ResolveError::UnknownType {
                name: (*name).clone(),
                span: path.span,
            });
            return;
        }
        match self.resolve_item_in_module_path(&segments) {
            ModulePathLookup::Found(item) => {
                self.tables.insert_type(path.span, ResolvedType::Item(item));
            }
            ModulePathLookup::ModuleMissing => {
                self.errors.push(ResolveError::UnknownModulePath {
                    path: segments[..segments.len() - 1].join("::"),
                    span: path.span,
                });
            }
            ModulePathLookup::NameMissing { module_path, name } => {
                self.errors.push(ResolveError::UnknownTypeInModule {
                    module_path,
                    name,
                    span: path.span,
                });
            }
            ModulePathLookup::NotVisible { module_path, name } => {
                self.errors.push(ResolveError::PrivateItemInModule {
                    module_path,
                    name,
                    span: path.span,
                });
            }
        }
    }

    fn resolve_enum_path(&mut self, path: &Spanned<HirEnumPath>) {
        let type_name = path.node.type_name.node.name.clone();
        if let Some(item) = self.resolve_item_in_scope(&type_name) {
            self.tables.insert_type(path.span, ResolvedType::Item(item));
            return;
        }
        self.errors.push(ResolveError::UnknownType {
            name: type_name,
            span: path.span,
        });
    }

    fn insert_generic(&mut self, name: &str) {
        let scope = match self.generic_scopes.last_mut() {
            Some(scope) => scope,
            None => return,
        };
        scope.insert(name.to_string(), ());
    }

    fn is_generic(&self, name: &str) -> bool {
        self.generic_scopes
            .iter()
            .rev()
            .any(|scope| scope.contains_key(name))
    }

    fn resolve_local(&self, name: &str) -> Option<LocalId> {
        for scope in self.local_scopes.iter().rev() {
            if let Some(local) = scope.get(name).copied() {
                return Some(local);
            }
        }
        None
    }

    fn resolve_item_in_scope(&self, name: &str) -> Option<ItemId> {
        let mut current = Some(self.current_module);
        while let Some(module_id) = current {
            let module = self.module_graph.module(module_id)?;
            if let Some(item) = module.scope.get(name).copied() {
                return Some(item);
            }
            current = module.parent;
        }
        None
    }

    fn resolve_item_in_module_path(&self, segments: &[String]) -> ModulePathLookup {
        if segments.len() < 2 {
            return ModulePathLookup::ModuleMissing;
        }
        let (module_path, tail) = segments.split_at(segments.len() - 1);
        let Some(module_id) = self.module_graph.module_id(module_path) else {
            return ModulePathLookup::ModuleMissing;
        };
        let Some(module) = self.module_graph.module(module_id) else {
            return ModulePathLookup::ModuleMissing;
        };

        let module_path_string = module_path.join("::");
        if let Some(item) = module.scope.get(&tail[0]).copied() {
            if !module_path.is_empty()
                && self
                    .items
                    .get(item.0)
                    .is_some_and(|info| info.visibility == HirVisibility::Private)
            {
                ModulePathLookup::NotVisible {
                    module_path: module_path_string,
                    name: tail[0].clone(),
                }
            } else {
                ModulePathLookup::Found(item)
            }
        } else {
            ModulePathLookup::NameMissing {
                module_path: module_path_string,
                name: tail[0].clone(),
            }
        }
    }

    fn insert_local(&mut self, name: &str, span: syntax::SpanInfo) {
        if let Some((_, previous_span)) = self.find_shadowed_local(name) {
            self.warnings.push(ResolveWarning::ShadowedLocal {
                name: name.to_string(),
                span,
                previous: previous_span,
            });
        } else if let Some(previous_item) = self.resolve_item_in_scope(name) {
            let previous_span = self
                .items
                .get(previous_item.0)
                .map(|item| item.span)
                .unwrap_or(span);
            self.warnings.push(ResolveWarning::ShadowedLocal {
                name: name.to_string(),
                span,
                previous: previous_span,
            });
        }
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

    fn find_shadowed_local(&self, name: &str) -> Option<(LocalId, syntax::SpanInfo)> {
        for scope in self.local_scopes.iter().rev().skip(1) {
            if let Some(local) = scope.get(name).copied() {
                let span = self
                    .tables
                    .local_info(local)
                    .map(|info| info.span)
                    .unwrap_or_else(|| syntax::SpanInfo {
                        start: 0,
                        end: 0,
                        line_col_start: (1, 1),
                        line_col_end: (1, 1),
                    });
                return Some((local, span));
            }
        }
        None
    }

    fn push_scope(&mut self) {
        self.local_scopes.push(HashMap::new());
    }

    fn pop_scope(&mut self) {
        self.local_scopes.pop();
    }

    fn push_generic_scope(&mut self) {
        self.generic_scopes.push(HashMap::new());
    }

    fn pop_generic_scope(&mut self) {
        self.generic_scopes.pop();
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Resolution {
    pub items: Vec<ItemInfo>,
    pub module_graph: ModuleGraph,
    pub tables: ResolutionTables,
    pub warnings: Vec<ResolveWarning>,
    pub builtin_items: HashMap<ItemId, usize>,
}

fn path_tail(path: &Spanned<HirPath>) -> String {
    path.node
        .segments
        .last()
        .map(|segment| segment.node.name.node.name.clone())
        .unwrap_or_else(|| "<unnamed>".to_string())
}

fn path_segments(path: &Spanned<HirPath>) -> Vec<String> {
    path.node
        .segments
        .iter()
        .map(|segment| segment.node.name.node.name.clone())
        .collect()
}

fn builtin_span() -> syntax::SpanInfo {
    syntax::SpanInfo {
        start: 0,
        end: 0,
        line_col_start: (1, 1),
        line_col_end: (1, 1),
    }
}

enum ModulePathLookup {
    Found(ItemId),
    ModuleMissing,
    NameMissing { module_path: String, name: String },
    NotVisible { module_path: String, name: String },
}
