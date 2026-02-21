use crate::syntax::Spanned;

use super::common::{HirIdentifier, HirPath};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum HirPrimitiveType {
    Bool,
    I32,
    I64,
    U8,
    F64,
    Char,
    String,
    Unit,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum HirType {
    Primitive(Spanned<HirPrimitiveType>),
    Complex(Spanned<HirPath>),
    Array(Box<Spanned<HirType>>),
    Ref(Box<Spanned<HirType>>),
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct HirField {
    pub name: Spanned<HirIdentifier>,
    pub ty: Spanned<HirType>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum HirParameterModifier {
    Ref,
    Out,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct HirParameter {
    pub modifier: Option<Spanned<HirParameterModifier>>,
    pub name: Spanned<HirIdentifier>,
    pub ty: Spanned<HirType>,
}
