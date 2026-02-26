use crate::syntax::Spanned;

use super::block::HirBlock;
use super::common::{HirIdentifier, HirPath, HirVisibility};
use super::phase::Phase;
use super::types::{HirField, HirParameter, HirType};

#[derive(pecan_ast_derive::PhaseFromAst)]
#[phase(source = "crate::syntax::Node", phase = "crate::hir::AstPhase")]
pub enum Item<P: Phase> {
    #[phase(from = "Function")]
    FunctionDefinition(Spanned<P::FunctionDefinition>),
    #[phase(from = "Method")]
    MethodDefinition(Spanned<P::MethodDefinition>),
    TypeDefinition(Spanned<P::TypeDefinition>),
    EnumDefinition(Spanned<P::EnumDefinition>),
    ContractDefinition(Spanned<P::ContractDefinition>),
    ModuleDeclaration(Spanned<P::ModuleDeclaration>),
    InlineModule(Spanned<P::InlineModule>),
    UseDeclaration(Spanned<P::UseDeclaration>),
}

pub struct HirFunctionDefinition {
    pub visibility: Spanned<HirVisibility>,
    pub name: Spanned<HirIdentifier>,
    pub generics: Vec<Spanned<HirIdentifier>>,
    pub parameters: Vec<Spanned<HirParameter>>,
    pub return_type: Option<Spanned<HirType>>,
    pub body: Spanned<HirBlock>,
}

pub struct HirMethodDefinition {
    pub visibility: Spanned<HirVisibility>,
    pub receiver_type: Spanned<HirType>,
    pub name: Spanned<HirIdentifier>,
    pub parameters: Vec<Spanned<HirParameter>>,
    pub return_type: Option<Spanned<HirType>>,
    pub body: Spanned<HirBlock>,
}

pub struct HirTypeDefinition {
    pub visibility: Spanned<HirVisibility>,
    pub name: Spanned<HirIdentifier>,
    pub generics: Vec<Spanned<HirIdentifier>>,
    pub fields: Vec<Spanned<HirField>>,
}

pub struct HirEnumDefinition {
    pub visibility: Spanned<HirVisibility>,
    pub name: Spanned<HirIdentifier>,
    pub generics: Vec<Spanned<HirIdentifier>>,
    pub variants: Vec<Spanned<HirEnumVariant>>,
}

pub struct HirEnumVariant {
    pub name: Spanned<HirIdentifier>,
    pub fields: Vec<Spanned<HirField>>,
}

pub struct HirContractDefinition {
    pub visibility: Spanned<HirVisibility>,
    pub name: Spanned<HirIdentifier>,
    pub items: Vec<Spanned<HirContractNode>>,
}

pub enum HirContractNode {
    MethodSignature(Spanned<HirContractMethodSignature>),
    Embedding(Spanned<HirContractEmbedding>),
}

pub struct HirContractMethodSignature {
    pub name: Spanned<HirIdentifier>,
    pub parameters: Vec<Spanned<HirParameter>>,
    pub return_type: Option<Spanned<HirType>>,
}

pub struct HirContractEmbedding {
    pub name: Spanned<HirIdentifier>,
}

pub struct HirModuleDeclaration {
    pub visibility: Spanned<HirVisibility>,
    pub path: Spanned<HirPath>,
}

pub struct HirInlineModule {
    pub visibility: Spanned<HirVisibility>,
    pub name: Spanned<HirIdentifier>,
    pub items: Vec<Spanned<Item<crate::hir::HirPhase>>>,
}

pub struct HirUseDeclaration {
    pub visibility: Spanned<HirVisibility>,
    pub path: Spanned<HirPath>,
}
