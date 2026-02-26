use crate::hir::{
    AstItem, AstProgram, HirContractDefinition, HirContractEmbedding, HirContractMethodSignature,
    HirContractNode, HirEnumDefinition, HirEnumVariant, HirFunctionDefinition, HirInlineModule, HirItem,
    HirMethodDefinition, HirModuleDeclaration, HirProgram, HirTypeDefinition, HirUseDeclaration,
};
use crate::syntax::{self, Spanned};

use super::Lowerable;

impl Lowerable for Spanned<AstProgram> {
    type Output = Spanned<HirProgram>;

    fn lower(&self) -> Self::Output {
        let items = self.node.items.iter().map(Lowerable::lower).collect();
        Spanned::new(HirProgram { items }, self.span)
    }
}

impl Lowerable for Spanned<AstItem> {
    type Output = Spanned<HirItem>;

    fn lower(&self) -> Self::Output {
        let node = match &self.node {
            AstItem::FunctionDefinition(def) => HirItem::FunctionDefinition(def.lower()),
            AstItem::MethodDefinition(def) => HirItem::MethodDefinition(def.lower()),
            AstItem::TypeDefinition(def) => HirItem::TypeDefinition(def.lower()),
            AstItem::EnumDefinition(def) => HirItem::EnumDefinition(def.lower()),
            AstItem::ContractDefinition(def) => HirItem::ContractDefinition(def.lower()),
            AstItem::ModuleDeclaration(def) => HirItem::ModuleDeclaration(def.lower()),
            AstItem::InlineModule(def) => HirItem::InlineModule(def.lower()),
            AstItem::UseDeclaration(def) => HirItem::UseDeclaration(def.lower()),
        };
        Spanned::new(node, self.span)
    }
}

impl Lowerable for Spanned<syntax::FunctionDefinition> {
    type Output = Spanned<HirFunctionDefinition>;

    fn lower(&self) -> Self::Output {
        Spanned::new(
            HirFunctionDefinition {
                visibility: self.node.visibility.lower(),
                name: self.node.name.lower(),
                generics: self.node.generics.iter().map(Lowerable::lower).collect(),
                parameters: self.node.parameters.iter().map(Lowerable::lower).collect(),
                return_type: self.node.return_type.as_ref().map(Lowerable::lower),
                body: self.node.body.lower(),
            },
            self.span,
        )
    }
}

impl Lowerable for Spanned<syntax::MethodDefinition> {
    type Output = Spanned<HirMethodDefinition>;

    fn lower(&self) -> Self::Output {
        Spanned::new(
            HirMethodDefinition {
                visibility: self.node.visibility.lower(),
                receiver_type: self.node.receiver_type.lower(),
                name: self.node.name.lower(),
                parameters: self.node.parameters.iter().map(Lowerable::lower).collect(),
                return_type: self.node.return_type.as_ref().map(Lowerable::lower),
                body: self.node.body.lower(),
            },
            self.span,
        )
    }
}

impl Lowerable for Spanned<syntax::TypeDefinition> {
    type Output = Spanned<HirTypeDefinition>;

    fn lower(&self) -> Self::Output {
        Spanned::new(
            HirTypeDefinition {
                visibility: self.node.visibility.lower(),
                name: self.node.name.lower(),
                generics: self.node.generics.iter().map(Lowerable::lower).collect(),
                fields: self.node.fields.iter().map(Lowerable::lower).collect(),
            },
            self.span,
        )
    }
}

impl Lowerable for Spanned<syntax::EnumDefinition> {
    type Output = Spanned<HirEnumDefinition>;

    fn lower(&self) -> Self::Output {
        Spanned::new(
            HirEnumDefinition {
                visibility: self.node.visibility.lower(),
                name: self.node.name.lower(),
                generics: self.node.generics.iter().map(Lowerable::lower).collect(),
                variants: self.node.variants.iter().map(Lowerable::lower).collect(),
            },
            self.span,
        )
    }
}

impl Lowerable for Spanned<syntax::EnumVariant> {
    type Output = Spanned<HirEnumVariant>;

    fn lower(&self) -> Self::Output {
        Spanned::new(
            HirEnumVariant {
                name: self.node.name.lower(),
                fields: self.node.fields.iter().map(Lowerable::lower).collect(),
            },
            self.span,
        )
    }
}

impl Lowerable for Spanned<syntax::ContractDefinition> {
    type Output = Spanned<HirContractDefinition>;

    fn lower(&self) -> Self::Output {
        Spanned::new(
            HirContractDefinition {
                visibility: self.node.visibility.lower(),
                name: self.node.name.lower(),
                items: self.node.items.iter().map(Lowerable::lower).collect(),
            },
            self.span,
        )
    }
}

impl Lowerable for Spanned<syntax::ContractNode> {
    type Output = Spanned<HirContractNode>;

    fn lower(&self) -> Self::Output {
        let lowered = match &self.node {
            syntax::ContractNode::MethodSignature(signature) => {
                HirContractNode::MethodSignature(signature.lower())
            }
            syntax::ContractNode::Embedding(embedding) => HirContractNode::Embedding(embedding.lower()),
        };
        Spanned::new(lowered, self.span)
    }
}

impl Lowerable for Spanned<syntax::ContractMethodSignature> {
    type Output = Spanned<HirContractMethodSignature>;

    fn lower(&self) -> Self::Output {
        Spanned::new(
            HirContractMethodSignature {
                name: self.node.name.lower(),
                parameters: self.node.parameters.iter().map(Lowerable::lower).collect(),
                return_type: self.node.return_type.as_ref().map(Lowerable::lower),
            },
            self.span,
        )
    }
}

impl Lowerable for Spanned<syntax::ContractEmbedding> {
    type Output = Spanned<HirContractEmbedding>;

    fn lower(&self) -> Self::Output {
        Spanned::new(
            HirContractEmbedding {
                name: self.node.name.lower(),
            },
            self.span,
        )
    }
}

impl Lowerable for Spanned<syntax::ModuleDeclaration> {
    type Output = Spanned<HirModuleDeclaration>;

    fn lower(&self) -> Self::Output {
        Spanned::new(
            HirModuleDeclaration {
                visibility: self.node.visibility.lower(),
                path: self.node.path.lower(),
            },
            self.span,
        )
    }
}

impl Lowerable for Spanned<syntax::InlineModule> {
    type Output = Spanned<HirInlineModule>;

    fn lower(&self) -> Self::Output {
        let items = self
            .node
            .items
            .iter()
            .map(|item| {
                let node = match &item.node {
                    syntax::Node::Function(def) => HirItem::FunctionDefinition(def.lower()),
                    syntax::Node::Method(def) => HirItem::MethodDefinition(def.lower()),
                    syntax::Node::TypeDefinition(def) => HirItem::TypeDefinition(def.lower()),
                    syntax::Node::EnumDefinition(def) => HirItem::EnumDefinition(def.lower()),
                    syntax::Node::ContractDefinition(def) => HirItem::ContractDefinition(def.lower()),
                    syntax::Node::ModuleDeclaration(def) => HirItem::ModuleDeclaration(def.lower()),
                    syntax::Node::InlineModule(def) => HirItem::InlineModule(def.lower()),
                    syntax::Node::UseDeclaration(def) => HirItem::UseDeclaration(def.lower()),
                };
                Spanned::new(node, item.span)
            })
            .collect();

        Spanned::new(
            HirInlineModule {
                visibility: self.node.visibility.lower(),
                name: self.node.name.lower(),
                items,
            },
            self.span,
        )
    }
}

impl Lowerable for Spanned<syntax::UseDeclaration> {
    type Output = Spanned<HirUseDeclaration>;

    fn lower(&self) -> Self::Output {
        Spanned::new(
            HirUseDeclaration {
                visibility: self.node.visibility.lower(),
                path: self.node.path.lower(),
            },
            self.span,
        )
    }
}
