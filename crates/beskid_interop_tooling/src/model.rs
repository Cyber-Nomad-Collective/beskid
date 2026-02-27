use std::path::PathBuf;

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub enum ReturnGroup {
    Unit,
    Usize,
    Ptr,
}

impl ReturnGroup {
    pub fn dispatch_builtin(self) -> &'static str {
        match self {
            ReturnGroup::Unit => "__interop_dispatch_unit",
            ReturnGroup::Usize => "__interop_dispatch_usize",
            ReturnGroup::Ptr => "__interop_dispatch_ptr",
        }
    }

    pub fn beskid_return_type(self) -> &'static str {
        match self {
            ReturnGroup::Unit => "unit",
            ReturnGroup::Usize => "i64",
            ReturnGroup::Ptr => "ptr",
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub struct InteropParam {
    pub name: String,
    pub beskid_type: String,
}

#[derive(Debug, Clone, Eq, PartialEq)]
pub struct InteropDecl {
    pub module_path: String,
    pub function_name: String,
    pub runtime_symbol: String,
    pub variant_name: String,
    pub params: Vec<InteropParam>,
    pub return_group: ReturnGroup,
    pub source: PathBuf,
    pub line: usize,
}

impl PartialOrd for InteropDecl {
    fn partial_cmp(&self, other: &Self) -> Option<std::cmp::Ordering> {
        Some(self.cmp(other))
    }
}

impl Ord for InteropDecl {
    fn cmp(&self, other: &Self) -> std::cmp::Ordering {
        self.module_path
            .cmp(&other.module_path)
            .then(self.function_name.cmp(&other.function_name))
            .then(self.variant_name.cmp(&other.variant_name))
    }
}
