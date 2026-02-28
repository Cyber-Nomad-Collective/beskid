use std::collections::HashMap;

use super::ids::{ItemId, ModuleId};

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ModuleInfo {
    pub id: ModuleId,
    pub path: Vec<String>,
    pub parent: Option<ModuleId>,
    pub children: Vec<ModuleId>,
    pub items: Vec<ItemId>,
    pub scope: HashMap<String, ItemId>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ModuleGraph {
    modules: Vec<ModuleInfo>,
    path_map: HashMap<Vec<String>, ModuleId>,
    root: ModuleId,
}

impl ModuleGraph {
    pub fn new_root() -> Self {
        let mut graph = Self {
            modules: Vec::new(),
            path_map: HashMap::new(),
            root: ModuleId(0),
        };
        let root = graph.intern_module(Vec::new(), None);
        graph.root = root;
        graph
    }

    pub fn root(&self) -> ModuleId {
        self.root
    }

    pub fn module(&self, id: ModuleId) -> Option<&ModuleInfo> {
        self.modules.get(id.0)
    }

    pub fn module_id(&self, path: &[String]) -> Option<ModuleId> {
        self.path_map.get(path).copied()
    }

    pub fn module_mut(&mut self, id: ModuleId) -> Option<&mut ModuleInfo> {
        self.modules.get_mut(id.0)
    }

    pub fn modules(&self) -> &[ModuleInfo] {
        &self.modules
    }

    pub fn ensure_module_path(&mut self, path: &[String]) -> ModuleId {
        let mut current = self.root;
        let mut path_acc = Vec::new();
        for segment in path {
            path_acc.push(segment.clone());
            let id = match self.path_map.get(&path_acc).copied() {
                Some(existing) => existing,
                None => self.intern_module(path_acc.clone(), Some(current)),
            };
            current = id;
        }
        current
    }

    pub fn insert_item(&mut self, module: ModuleId, name: String, item: ItemId) -> Option<ItemId> {
        let module = self.modules.get_mut(module.0)?;
        if let Some(prev) = module.scope.get(&name).copied() {
            Some(prev)
        } else {
            module.scope.insert(name, item);
            module.items.push(item);
            None
        }
    }

    fn intern_module(&mut self, path: Vec<String>, parent: Option<ModuleId>) -> ModuleId {
        let id = ModuleId(self.modules.len());
        self.modules.push(ModuleInfo {
            id,
            path: path.clone(),
            parent,
            children: Vec::new(),
            items: Vec::new(),
            scope: HashMap::new(),
        });
        self.path_map.insert(path, id);
        if let Some(parent) = parent
            && let Some(parent_module) = self.modules.get_mut(parent.0)
        {
            parent_module.children.push(id);
        }
        id
    }
}

impl Default for ModuleGraph {
    fn default() -> Self {
        Self::new_root()
    }
}
