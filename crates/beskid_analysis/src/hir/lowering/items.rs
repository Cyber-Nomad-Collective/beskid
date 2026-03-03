use crate::hir::{
    AstItem, AstProgram, HirAttribute, HirAttributeDeclaration, HirAttributeParameter,
    HirAttributeTarget, HirContractDefinition, HirContractEmbedding, HirContractMethodSignature,
    HirContractNode, HirEnumDefinition, HirEnumVariant, HirExternInterface,
    HirFunctionDefinition, HirInlineModule, HirItem, HirMethodDefinition, HirModuleDeclaration,
    HirProgram, HirTypeDefinition, HirUseDeclaration,
};
use crate::syntax::{self, Spanned};

use super::Lowerable;

fn lower_extern_interface(
    attributes: &[Spanned<syntax::Attribute>],
) -> Option<HirExternInterface> {
    let extern_attr = attributes
        .iter()
        .find(|attr| attr.node.name.node.name == "Extern")?;
    let mut abi = None;
    let mut library = None;
    for arg in &extern_attr.node.arguments {
        match arg.node.name.node.name.as_str() {
            "Abi" => abi = extract_string_literal(&arg.node.value),
            "Library" => library = extract_string_literal(&arg.node.value),
            _ => {}
        }
    }
    Some(HirExternInterface { abi, library })
}

fn lower_attributes(attributes: &[Spanned<syntax::Attribute>]) -> Vec<Spanned<HirAttribute>> {
    attributes
        .iter()
        .map(|attribute| {
            Spanned::new(
                HirAttribute {
                    name: attribute.node.name.lower(),
                },
                attribute.span,
            )
        })
        .collect()
}

fn extract_string_literal(expression: &Spanned<syntax::Expression>) -> Option<String> {
    let syntax::Expression::Literal(literal_expr) = &expression.node else {
        return None;
    };
    let syntax::Literal::String(raw) = &literal_expr.node.literal.node else {
        return None;
    };
    let value = raw
        .strip_prefix('"')
        .and_then(|trimmed| trimmed.strip_suffix('"'))
        .unwrap_or(raw)
        .to_string();
    Some(value)
}

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
            AstItem::AttributeDeclaration(def) => HirItem::AttributeDeclaration(def.lower()),
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
                extern_interface: lower_extern_interface(&self.node.attributes),
                attributes: lower_attributes(&self.node.attributes),
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
            syntax::ContractNode::Embedding(embedding) => {
                HirContractNode::Embedding(embedding.lower())
            }
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

impl Lowerable for Spanned<syntax::AttributeDeclaration> {
    type Output = Spanned<HirAttributeDeclaration>;

    fn lower(&self) -> Self::Output {
        Spanned::new(
            HirAttributeDeclaration {
                visibility: self.node.visibility.lower(),
                name: self.node.name.lower(),
                targets: self.node.targets.iter().map(Lowerable::lower).collect(),
                parameters: self.node.parameters.iter().map(Lowerable::lower).collect(),
            },
            self.span,
        )
    }
}

impl Lowerable for Spanned<syntax::AttributeTarget> {
    type Output = Spanned<HirAttributeTarget>;

    fn lower(&self) -> Self::Output {
        Spanned::new(
            HirAttributeTarget {
                name: self.node.name.lower(),
            },
            self.span,
        )
    }
}

impl Lowerable for Spanned<syntax::AttributeParameter> {
    type Output = Spanned<HirAttributeParameter>;

    fn lower(&self) -> Self::Output {
        Spanned::new(
            HirAttributeParameter {
                name: self.node.name.lower(),
                ty: self.node.ty.lower(),
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
                extern_interface: lower_extern_interface(&self.node.attributes),
                attributes: lower_attributes(&self.node.attributes),
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
                    syntax::Node::ContractDefinition(def) => {
                        HirItem::ContractDefinition(def.lower())
                    }
                    syntax::Node::AttributeDeclaration(def) => {
                        HirItem::AttributeDeclaration(def.lower())
                    }
                    syntax::Node::ModuleDeclaration(def) => HirItem::ModuleDeclaration(def.lower()),
                    syntax::Node::InlineModule(def) => HirItem::InlineModule(def.lower()),
                    syntax::Node::UseDeclaration(def) => HirItem::UseDeclaration(def.lower()),
                };
                Spanned::new(node, item.span)
            })
            .collect();

        Spanned::new(
            HirInlineModule {
                extern_interface: lower_extern_interface(&self.node.attributes),
                attributes: lower_attributes(&self.node.attributes),
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
