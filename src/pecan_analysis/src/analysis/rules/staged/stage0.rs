use super::SemanticPipelineRule;
use crate::analysis::Severity;
use crate::analysis::rules::RuleContext;
use crate::hir::{AstItem, AstProgram};
use crate::syntax::{ContractDefinition, ContractNode, Path, SpanInfo, Spanned, Type};
use std::collections::{HashMap, HashSet};

impl SemanticPipelineRule {
    pub(super) fn stage0_collect_definitions(&self, ctx: &mut RuleContext, hir: &Spanned<AstProgram>) {
        self.check_duplicate_definition_names(ctx, hir);
        self.check_duplicate_non_type_item_names(ctx, hir);
        self.check_unknown_types_in_definitions(ctx, hir);
        self.check_conflicting_embedded_contracts(ctx, hir);

        for item in &hir.node.items {
            match &item.node {
                AstItem::EnumDefinition(definition) => {
                    self.check_duplicate_enum_variants(ctx, definition);
                }
                AstItem::ContractDefinition(definition) => {
                    self.check_duplicate_contract_methods(ctx, definition);
                }
                _ => {}
            }
        }
    }

    fn check_duplicate_non_type_item_names(
        &self,
        ctx: &mut RuleContext,
        hir: &Spanned<AstProgram>,
    ) {
        let mut seen: HashMap<String, SpanInfo> = HashMap::new();

        for item in &hir.node.items {
            let (name, span) = match &item.node {
                AstItem::FunctionDefinition(definition) => (
                    definition.node.name.node.name.clone(),
                    definition.node.name.span,
                ),
                AstItem::ModuleDeclaration(definition) => (
                    self.path_tail(&definition.node.path),
                    definition.node.path.span,
                ),
                AstItem::UseDeclaration(definition) => (
                    self.path_tail(&definition.node.path),
                    definition.node.path.span,
                ),
                _ => continue,
            };

            let Some(previous_span) = seen.insert(name.clone(), span) else {
                continue;
            };

            let help = Some(format!(
                "previously defined at line {}, column {}",
                previous_span.line_col_start.0, previous_span.line_col_start.1
            ));
            ctx.emit_simple(
                span,
                "E1006",
                format!("duplicate item name `{name}`"),
                "duplicate item name",
                help,
                Severity::Error,
            );
        }
    }

    fn check_unknown_types_in_definitions(&self, ctx: &mut RuleContext, hir: &Spanned<AstProgram>) {
        let known_types = self.collect_known_type_names(hir);

        for item in &hir.node.items {
            match &item.node {
                AstItem::TypeDefinition(definition) => {
                    let generic_names = self.collect_generic_names(&definition.node.generics);
                    for field in &definition.node.fields {
                        self.validate_type_reference(
                            ctx,
                            &field.node.ty,
                            &known_types,
                            &generic_names,
                        );
                    }
                }
                AstItem::EnumDefinition(definition) => {
                    let generic_names = self.collect_generic_names(&definition.node.generics);
                    for variant in &definition.node.variants {
                        for field in &variant.node.fields {
                            self.validate_type_reference(
                                ctx,
                                &field.node.ty,
                                &known_types,
                                &generic_names,
                            );
                        }
                    }
                }
                AstItem::FunctionDefinition(definition) => {
                    let generic_names = self.collect_generic_names(&definition.node.generics);
                    for parameter in &definition.node.parameters {
                        self.validate_type_reference(
                            ctx,
                            &parameter.node.ty,
                            &known_types,
                            &generic_names,
                        );
                    }
                    if let Some(return_type) = &definition.node.return_type {
                        self.validate_type_reference(ctx, return_type, &known_types, &generic_names);
                    }
                }
                AstItem::MethodDefinition(definition) => {
                    let generic_names = HashSet::new();
                    self.validate_type_reference(
                        ctx,
                        &definition.node.receiver_type,
                        &known_types,
                        &generic_names,
                    );
                    for parameter in &definition.node.parameters {
                        self.validate_type_reference(
                            ctx,
                            &parameter.node.ty,
                            &known_types,
                            &generic_names,
                        );
                    }
                    if let Some(return_type) = &definition.node.return_type {
                        self.validate_type_reference(ctx, return_type, &known_types, &generic_names);
                    }
                }
                AstItem::ContractDefinition(definition) => {
                    let generic_names = HashSet::new();
                    for node in &definition.node.items {
                        let ContractNode::MethodSignature(signature) = &node.node else {
                            continue;
                        };
                        for parameter in &signature.node.parameters {
                            self.validate_type_reference(
                                ctx,
                                &parameter.node.ty,
                                &known_types,
                                &generic_names,
                            );
                        }
                        if let Some(return_type) = &signature.node.return_type {
                            self.validate_type_reference(
                                ctx,
                                return_type,
                                &known_types,
                                &generic_names,
                            );
                        }
                    }
                }
                _ => {}
            }
        }
    }

    fn check_conflicting_embedded_contracts(&self, ctx: &mut RuleContext, hir: &Spanned<AstProgram>) {
        let contracts = self.collect_contract_definitions(hir);

        for definition in contracts.values() {
            let mut known_signatures = self.contract_methods(definition);

            for item in &definition.node.items {
                let ContractNode::Embedding(embedding) = &item.node else {
                    continue;
                };
                let embedded_name = embedding.node.name.node.name.clone();
                let Some(embedded_contract) = contracts.get(&embedded_name) else {
                    continue;
                };

                for (method_name, signature) in self.contract_methods(embedded_contract) {
                    let Some(previous) = known_signatures.insert(method_name.clone(), signature.clone()) else {
                        continue;
                    };
                    if previous == signature {
                        continue;
                    }

                    ctx.emit_simple(
                        embedding.node.name.span,
                        "E1004",
                        format!(
                            "embedded contract `{embedded_name}` introduces conflicting method `{method_name}`"
                        ),
                        "conflicting embedded contract method",
                        Some("embedded contract method signature conflicts with an existing method".to_string()),
                        Severity::Error,
                    );
                }
            }
        }
    }

    fn collect_contract_definitions<'a>(
        &self,
        hir: &'a Spanned<AstProgram>,
    ) -> HashMap<String, &'a Spanned<ContractDefinition>> {
        let mut contracts = HashMap::new();
        for item in &hir.node.items {
            let AstItem::ContractDefinition(definition) = &item.node else {
                continue;
            };
            contracts.insert(definition.node.name.node.name.clone(), definition);
        }
        contracts
    }

    fn contract_methods(&self, definition: &Spanned<ContractDefinition>) -> HashMap<String, String> {
        let mut methods = HashMap::new();
        for item in &definition.node.items {
            let ContractNode::MethodSignature(signature) = &item.node else {
                continue;
            };
            let name = signature.node.name.node.name.clone();
            let signature_string = self.contract_signature_string(signature);
            methods.insert(name, signature_string);
        }
        methods
    }

    fn contract_signature_string(
        &self,
        signature: &Spanned<crate::syntax::ContractMethodSignature>,
    ) -> String {
        let params = signature
            .node
            .parameters
            .iter()
            .map(|parameter| self.type_to_string(&parameter.node.ty))
            .collect::<Vec<_>>()
            .join(",");
        let return_type = signature
            .node
            .return_type
            .as_ref()
            .map(|ty| self.type_to_string(ty))
            .unwrap_or_else(|| "unit".to_string());
        format!("{return_type}({params})")
    }

    fn type_to_string(&self, ty: &Spanned<Type>) -> String {
        match &ty.node {
            Type::Primitive(primitive) => match primitive.node {
                crate::syntax::PrimitiveType::Bool => "bool".to_string(),
                crate::syntax::PrimitiveType::I32 => "i32".to_string(),
                crate::syntax::PrimitiveType::I64 => "i64".to_string(),
                crate::syntax::PrimitiveType::U8 => "u8".to_string(),
                crate::syntax::PrimitiveType::F64 => "f64".to_string(),
                crate::syntax::PrimitiveType::Char => "char".to_string(),
                crate::syntax::PrimitiveType::String => "string".to_string(),
                crate::syntax::PrimitiveType::Unit => "unit".to_string(),
            },
            Type::Complex(path) => path
                .node
                .segments
                .iter()
                .map(|segment| segment.node.name.clone())
                .collect::<Vec<_>>()
                .join("."),
            Type::Array(inner) => format!("{}[]", self.type_to_string(inner)),
            Type::Ref(inner) => format!("ref {}", self.type_to_string(inner)),
        }
    }

    fn collect_known_type_names(&self, hir: &Spanned<AstProgram>) -> HashSet<String> {
        let mut known = HashSet::new();

        for primitive in ["bool", "i32", "i64", "u8", "f64", "char", "string", "unit"] {
            known.insert(primitive.to_string());
        }

        for item in &hir.node.items {
            match &item.node {
                AstItem::TypeDefinition(definition) => {
                    known.insert(definition.node.name.node.name.clone());
                }
                AstItem::EnumDefinition(definition) => {
                    known.insert(definition.node.name.node.name.clone());
                }
                AstItem::ContractDefinition(definition) => {
                    known.insert(definition.node.name.node.name.clone());
                }
                _ => {}
            }
        }

        known
    }

    fn collect_generic_names(
        &self,
        generics: &[Spanned<crate::syntax::Identifier>],
    ) -> HashSet<String> {
        generics
            .iter()
            .map(|identifier| identifier.node.name.clone())
            .collect()
    }

    fn validate_type_reference(
        &self,
        ctx: &mut RuleContext,
        ty: &Spanned<Type>,
        known_types: &HashSet<String>,
        generic_names: &HashSet<String>,
    ) {
        match &ty.node {
            Type::Primitive(_) => {}
            Type::Complex(path) => {
                let Some(last_segment) = path.node.segments.last() else {
                    return;
                };
                let type_name = &last_segment.node.name;
                if known_types.contains(type_name) || generic_names.contains(type_name) {
                    return;
                }

                ctx.emit_simple(
                    path.span,
                    "E1005",
                    format!("unknown type `{type_name}` in definition"),
                    "unknown type in definition",
                    None,
                    Severity::Error,
                );
            }
            Type::Array(inner) | Type::Ref(inner) => {
                self.validate_type_reference(ctx, inner, known_types, generic_names);
            }
        }
    }

    fn path_tail(&self, path: &Spanned<Path>) -> String {
        path.node
            .segments
            .last()
            .map(|segment| segment.node.name.clone())
            .unwrap_or_default()
    }

    fn check_duplicate_definition_names(&self, ctx: &mut RuleContext, hir: &Spanned<AstProgram>) {
        let mut seen: HashMap<&str, SpanInfo> = HashMap::new();

        for item in &hir.node.items {
            let (name, span) = match &item.node {
                AstItem::TypeDefinition(definition) => {
                    (definition.node.name.node.name.as_str(), definition.node.name.span)
                }
                AstItem::EnumDefinition(definition) => {
                    (definition.node.name.node.name.as_str(), definition.node.name.span)
                }
                AstItem::ContractDefinition(definition) => {
                    (definition.node.name.node.name.as_str(), definition.node.name.span)
                }
                _ => continue,
            };

            let Some(previous_span) = seen.insert(name, span) else {
                continue;
            };

            let help = Some(format!(
                "previously defined at line {}, column {}",
                previous_span.line_col_start.0, previous_span.line_col_start.1
            ));
            ctx.emit_simple(
                span,
                "E1001",
                format!("duplicate definition name `{name}`"),
                "duplicate definition name",
                help,
                Severity::Error,
            );
        }
    }

    fn check_duplicate_enum_variants(
        &self,
        ctx: &mut RuleContext,
        definition: &Spanned<crate::syntax::EnumDefinition>,
    ) {
        let mut seen: HashMap<&str, SpanInfo> = HashMap::new();
        for variant in &definition.node.variants {
            let name = variant.node.name.node.name.as_str();
            let Some(previous_span) = seen.insert(name, variant.node.name.span) else {
                continue;
            };

            let help = Some(format!(
                "previously defined at line {}, column {}",
                previous_span.line_col_start.0, previous_span.line_col_start.1
            ));
            ctx.emit_simple(
                variant.node.name.span,
                "E1002",
                format!("duplicate enum variant `{name}`"),
                "duplicate enum variant",
                help,
                Severity::Error,
            );
        }
    }

    fn check_duplicate_contract_methods(
        &self,
        ctx: &mut RuleContext,
        definition: &Spanned<crate::syntax::ContractDefinition>,
    ) {
        let mut seen: HashMap<&str, SpanInfo> = HashMap::new();
        for item in &definition.node.items {
            let ContractNode::MethodSignature(signature) = &item.node else {
                continue;
            };

            let name = signature.node.name.node.name.as_str();
            let Some(previous_span) = seen.insert(name, signature.node.name.span) else {
                continue;
            };

            let help = Some(format!(
                "previously defined at line {}, column {}",
                previous_span.line_col_start.0, previous_span.line_col_start.1
            ));
            ctx.emit_simple(
                signature.node.name.span,
                "E1003",
                format!("duplicate contract method `{name}`"),
                "duplicate contract method",
                help,
                Severity::Error,
            );
        }
    }
}
