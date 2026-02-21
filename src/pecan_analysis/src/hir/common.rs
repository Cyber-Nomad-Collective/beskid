use crate::syntax::Spanned;

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct HirIdentifier {
    pub name: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum HirVisibility {
    Public,
    Private,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct HirPath {
    pub segments: Vec<Spanned<HirIdentifier>>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct HirEnumPath {
    pub type_name: Spanned<HirIdentifier>,
    pub variant: Spanned<HirIdentifier>,
}
