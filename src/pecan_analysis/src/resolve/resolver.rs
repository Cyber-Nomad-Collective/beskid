use std::collections::HashMap;

use crate::hir::{AstProgram, Item as HirItem};
use crate::syntax::Spanned;

use super::errors::{ResolveError, ResolveResult};
use super::ids::ItemId;
use super::items::{ItemInfo, ItemKind};

#[derive(Debug, Default)]
pub struct Resolver {
    items: Vec<ItemInfo>,
    symbols: HashMap<String, ItemId>,
    errors: Vec<ResolveError>,
}

impl Resolver {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn resolve_program(&mut self, program: &Spanned<AstProgram>) -> ResolveResult<Resolution> {
        for item in &program.node.items {
            self.collect_item(item);
        }

        if self.errors.is_empty() {
            Ok(Resolution {
                items: std::mem::take(&mut self.items),
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
        self.items.push(ItemInfo {
            id,
            name,
            kind,
            span: item.span,
        });
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Resolution {
    pub items: Vec<ItemInfo>,
}

fn path_tail(path: &Spanned<crate::syntax::Path>) -> String {
    path.node
        .segments
        .last()
        .map(|segment| segment.node.name.clone())
        .unwrap_or_else(|| "<unnamed>".to_string())
}
