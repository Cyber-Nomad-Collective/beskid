use crate::syntax::Spanned;

use super::common::{HirIdentifier, HirPath};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, beskid_ast_derive::HirNode)]
#[ast(kind = "PrimitiveType")]
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

impl HirPrimitiveType {
    pub fn bit_width(&self) -> u32 {
        match self {
            HirPrimitiveType::Bool => 1,
            HirPrimitiveType::U8 => 8,
            HirPrimitiveType::I32 => 32,
            HirPrimitiveType::I64 => 64,
            HirPrimitiveType::F64 => 64,
            HirPrimitiveType::Char => 32,
            HirPrimitiveType::String => 64,
            HirPrimitiveType::Unit => 0,
        }
    }

    pub fn is_integer(&self) -> bool {
        matches!(
            self,
            HirPrimitiveType::I32 | HirPrimitiveType::I64 | HirPrimitiveType::U8
        )
    }
}

#[derive(Debug, Clone, PartialEq, Eq, beskid_ast_derive::HirNode)]
#[ast(kind = "Type")]
pub enum HirType {
    #[ast(child)]
    Primitive(Spanned<HirPrimitiveType>),
    #[ast(child)]
    Complex(Spanned<HirPath>),
    #[ast(child)]
    Array(Box<Spanned<HirType>>),
    #[ast(child)]
    Ref(Box<Spanned<HirType>>),
    #[ast(children)]
    Function {
        return_type: Box<Spanned<HirType>>,
        parameters: Vec<Spanned<HirType>>,
    },
}

#[derive(Debug, Clone, PartialEq, Eq, beskid_ast_derive::HirNode)]
#[ast(kind = "Field")]
pub struct HirField {
    #[ast(child)]
    pub name: Spanned<HirIdentifier>,
    #[ast(child)]
    pub ty: Spanned<HirType>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, beskid_ast_derive::HirNode)]
#[ast(kind = "ParameterModifier")]
pub enum HirParameterModifier {
    Ref,
    Out,
}

#[derive(Debug, Clone, PartialEq, Eq, beskid_ast_derive::HirNode)]
#[ast(kind = "Parameter")]
pub struct HirParameter {
    #[ast(child)]
    pub modifier: Option<Spanned<HirParameterModifier>>,
    #[ast(child)]
    pub name: Spanned<HirIdentifier>,
    #[ast(child)]
    pub ty: Spanned<HirType>,
}
