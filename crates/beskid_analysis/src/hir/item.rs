use crate::query::{HirNode, HirNodeKind, HirNodeRef};
use crate::syntax::Spanned;

use super::block::HirBlock;
use super::common::{HirIdentifier, HirPath, HirVisibility};
use super::phase::Phase;
use super::types::{HirField, HirParameter, HirType};

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct HirExternInterface {
    pub abi: Option<String>,
    pub library: Option<String>,
}

#[derive(beskid_ast_derive::HirNode)]
#[ast(kind = "Attribute")]
pub struct HirAttribute {
    #[ast(child)]
    pub name: Spanned<HirIdentifier>,
}

#[derive(beskid_ast_derive::PhaseFromAst)]
#[phase(source = "crate::syntax::Node", phase = "crate::hir::AstPhase")]
pub enum Item<P: Phase> {
    #[phase(from = "Function")]
    FunctionDefinition(Spanned<P::FunctionDefinition>),
    #[phase(from = "Method")]
    MethodDefinition(Spanned<P::MethodDefinition>),
    TypeDefinition(Spanned<P::TypeDefinition>),
    EnumDefinition(Spanned<P::EnumDefinition>),
    ContractDefinition(Spanned<P::ContractDefinition>),
    AttributeDeclaration(Spanned<P::AttributeDeclaration>),
    ModuleDeclaration(Spanned<P::ModuleDeclaration>),
    InlineModule(Spanned<P::InlineModule>),
    UseDeclaration(Spanned<P::UseDeclaration>),
}

impl HirNode for Item<crate::hir::HirPhase> {
    fn as_any(&self) -> &dyn std::any::Any {
        self
    }

    fn children<'a>(&'a self, push: &mut dyn FnMut(HirNodeRef<'a>)) {
        match self {
            Item::FunctionDefinition(def) => push(HirNodeRef(&def.node)),
            Item::MethodDefinition(def) => push(HirNodeRef(&def.node)),
            Item::TypeDefinition(def) => push(HirNodeRef(&def.node)),
            Item::EnumDefinition(def) => push(HirNodeRef(&def.node)),
            Item::ContractDefinition(def) => push(HirNodeRef(&def.node)),
            Item::AttributeDeclaration(def) => push(HirNodeRef(&def.node)),
            Item::ModuleDeclaration(def) => push(HirNodeRef(&def.node)),
            Item::InlineModule(def) => push(HirNodeRef(&def.node)),
            Item::UseDeclaration(def) => push(HirNodeRef(&def.node)),
        }
    }

    fn node_kind(&self) -> HirNodeKind {
        HirNodeKind::Item
    }
}

#[derive(beskid_ast_derive::HirNode)]
#[ast(kind = "FunctionDefinition")]
pub struct HirFunctionDefinition {
    #[ast(child)]
    pub visibility: Spanned<HirVisibility>,
    #[ast(child)]
    pub name: Spanned<HirIdentifier>,
    #[ast(children)]
    pub generics: Vec<Spanned<HirIdentifier>>,
    #[ast(children)]
    pub parameters: Vec<Spanned<HirParameter>>,
    #[ast(child)]
    pub return_type: Option<Spanned<HirType>>,
    #[ast(child)]
    pub body: Spanned<HirBlock>,
}

#[derive(beskid_ast_derive::HirNode)]
#[ast(kind = "MethodDefinition")]
pub struct HirMethodDefinition {
    #[ast(child)]
    pub visibility: Spanned<HirVisibility>,
    #[ast(child)]
    pub receiver_type: Spanned<HirType>,
    #[ast(child)]
    pub name: Spanned<HirIdentifier>,
    #[ast(children)]
    pub parameters: Vec<Spanned<HirParameter>>,
    #[ast(child)]
    pub return_type: Option<Spanned<HirType>>,
    #[ast(child)]
    pub body: Spanned<HirBlock>,
}

#[derive(beskid_ast_derive::HirNode)]
#[ast(kind = "TypeDefinition")]
pub struct HirTypeDefinition {
    #[ast(child)]
    pub visibility: Spanned<HirVisibility>,
    #[ast(child)]
    pub name: Spanned<HirIdentifier>,
    #[ast(children)]
    pub generics: Vec<Spanned<HirIdentifier>>,
    #[ast(children)]
    pub fields: Vec<Spanned<HirField>>,
}

#[derive(beskid_ast_derive::HirNode)]
#[ast(kind = "EnumDefinition")]
pub struct HirEnumDefinition {
    #[ast(child)]
    pub visibility: Spanned<HirVisibility>,
    #[ast(child)]
    pub name: Spanned<HirIdentifier>,
    #[ast(children)]
    pub generics: Vec<Spanned<HirIdentifier>>,
    #[ast(children)]
    pub variants: Vec<Spanned<HirEnumVariant>>,
}

#[derive(beskid_ast_derive::HirNode)]
#[ast(kind = "EnumVariant")]
pub struct HirEnumVariant {
    #[ast(child)]
    pub name: Spanned<HirIdentifier>,
    #[ast(children)]
    pub fields: Vec<Spanned<HirField>>,
}

#[derive(beskid_ast_derive::HirNode)]
#[ast(kind = "ContractDefinition")]
pub struct HirContractDefinition {
    #[ast(skip)]
    pub extern_interface: Option<HirExternInterface>,
    #[ast(children)]
    pub attributes: Vec<Spanned<HirAttribute>>,
    #[ast(child)]
    pub visibility: Spanned<HirVisibility>,
    #[ast(child)]
    pub name: Spanned<HirIdentifier>,
    #[ast(children)]
    pub items: Vec<Spanned<HirContractNode>>,
}

#[derive(beskid_ast_derive::HirNode)]
#[ast(kind = "ContractNode")]
pub enum HirContractNode {
    #[ast(child)]
    MethodSignature(Spanned<HirContractMethodSignature>),
    #[ast(child)]
    Embedding(Spanned<HirContractEmbedding>),
}

#[derive(beskid_ast_derive::HirNode)]
#[ast(kind = "ContractMethodSignature")]
pub struct HirContractMethodSignature {
    #[ast(child)]
    pub name: Spanned<HirIdentifier>,
    #[ast(children)]
    pub parameters: Vec<Spanned<HirParameter>>,
    #[ast(child)]
    pub return_type: Option<Spanned<HirType>>,
}

#[derive(beskid_ast_derive::HirNode)]
#[ast(kind = "ContractEmbedding")]
pub struct HirContractEmbedding {
    #[ast(child)]
    pub name: Spanned<HirIdentifier>,
}

#[derive(beskid_ast_derive::HirNode)]
#[ast(kind = "AttributeDeclaration")]
pub struct HirAttributeDeclaration {
    #[ast(child)]
    pub visibility: Spanned<HirVisibility>,
    #[ast(child)]
    pub name: Spanned<HirIdentifier>,
    #[ast(children)]
    pub targets: Vec<Spanned<HirAttributeTarget>>,
    #[ast(children)]
    pub parameters: Vec<Spanned<HirAttributeParameter>>,
}

#[derive(beskid_ast_derive::HirNode)]
#[ast(kind = "AttributeTarget")]
pub struct HirAttributeTarget {
    #[ast(child)]
    pub name: Spanned<HirIdentifier>,
}

#[derive(beskid_ast_derive::HirNode)]
#[ast(kind = "AttributeParameter")]
pub struct HirAttributeParameter {
    #[ast(child)]
    pub name: Spanned<HirIdentifier>,
    #[ast(child)]
    pub ty: Spanned<HirType>,
}

#[derive(beskid_ast_derive::HirNode)]
#[ast(kind = "ModuleDeclaration")]
pub struct HirModuleDeclaration {
    #[ast(skip)]
    pub extern_interface: Option<HirExternInterface>,
    #[ast(children)]
    pub attributes: Vec<Spanned<HirAttribute>>,
    #[ast(child)]
    pub visibility: Spanned<HirVisibility>,
    #[ast(child)]
    pub path: Spanned<HirPath>,
}

#[derive(beskid_ast_derive::HirNode)]
#[ast(kind = "InlineModule")]
pub struct HirInlineModule {
    #[ast(skip)]
    pub extern_interface: Option<HirExternInterface>,
    #[ast(children)]
    pub attributes: Vec<Spanned<HirAttribute>>,
    #[ast(child)]
    pub visibility: Spanned<HirVisibility>,
    #[ast(child)]
    pub name: Spanned<HirIdentifier>,
    #[ast(children)]
    pub items: Vec<Spanned<Item<crate::hir::HirPhase>>>,
}

#[derive(beskid_ast_derive::HirNode)]
#[ast(kind = "UseDeclaration")]
pub struct HirUseDeclaration {
    #[ast(child)]
    pub visibility: Spanned<HirVisibility>,
    #[ast(child)]
    pub path: Spanned<HirPath>,
}
