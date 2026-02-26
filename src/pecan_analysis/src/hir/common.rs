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
pub struct HirPathSegment {
    pub name: Spanned<HirIdentifier>,
    pub type_args: Vec<Spanned<crate::hir::HirType>>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct HirPath {
    pub segments: Vec<Spanned<HirPathSegment>>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct HirEnumPath {
    pub type_name: Spanned<HirIdentifier>,
    pub variant: Spanned<HirIdentifier>,
}
