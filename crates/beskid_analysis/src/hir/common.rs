use crate::syntax::Spanned;

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
#[derive(beskid_ast_derive::HirNode)]
#[ast(kind = "Identifier")]
pub struct HirIdentifier {
    #[ast(skip)]
    pub name: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[derive(beskid_ast_derive::HirNode)]
#[ast(kind = "Visibility")]
pub enum HirVisibility {
    Public,
    Private,
}

#[derive(Debug, Clone, PartialEq, Eq)]
#[derive(beskid_ast_derive::HirNode)]
#[ast(kind = "PathSegment")]
pub struct HirPathSegment {
    #[ast(child)]
    pub name: Spanned<HirIdentifier>,
    #[ast(children)]
    pub type_args: Vec<Spanned<crate::hir::HirType>>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
#[derive(beskid_ast_derive::HirNode)]
#[ast(kind = "Path")]
pub struct HirPath {
    #[ast(children)]
    pub segments: Vec<Spanned<HirPathSegment>>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
#[derive(beskid_ast_derive::HirNode)]
#[ast(kind = "EnumPath")]
pub struct HirEnumPath {
    #[ast(child)]
    pub type_name: Spanned<HirIdentifier>,
    #[ast(child)]
    pub variant: Spanned<HirIdentifier>,
}
