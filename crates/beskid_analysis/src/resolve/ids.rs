#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct ModuleId(pub usize);

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct ItemId(pub usize);

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct LocalId(pub usize);

impl Default for ModuleId {
    fn default() -> Self {
        ModuleId(0)
    }
}

impl Default for ItemId {
    fn default() -> Self {
        ItemId(0)
    }
}

impl Default for LocalId {
    fn default() -> Self {
        LocalId(0)
    }
}
