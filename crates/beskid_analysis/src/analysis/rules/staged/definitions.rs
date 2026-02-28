use super::SemanticPipelineRule;
use crate::analysis::Severity;
use crate::analysis::rules::RuleContext;
use crate::hir::{HirContractDefinition, HirItem, HirPath, HirPrimitiveType, HirProgram, HirType};
use crate::query::{HirNode, HirQuery};
use crate::syntax::{SpanInfo, Spanned};
use std::collections::{HashMap, HashSet};

impl SemanticPipelineRule {
    pub(super) fn stage0_collect_definitions(
        &self,
        ctx: &mut RuleContext,
        hir: &Spanned<HirProgram>,
    ) {
        self.check_duplicate_definition_names(ctx, hir);
        self.check_duplicate_non_type_item_names(ctx, hir);
        self.check_unknown_types_in_definitions(ctx, hir);
        self.check_conflicting_embedded_contracts(ctx, hir);

        for definition in HirQuery::from(&hir.node).of::<crate::hir::HirEnumDefinition>() {
            self.check_duplicate_enum_variants(ctx, definition);
        }

        for definition in HirQuery::from(&hir.node).of::<crate::hir::HirContractDefinition>() {
            self.check_duplicate_contract_methods(ctx, definition);
        }
    }

    fn check_duplicate_non_type_item_names(
        &self,
        ctx: &mut RuleContext,
        hir: &Spanned<HirProgram>,
    ) {
        let mut seen: HashMap<String, SpanInfo> = HashMap::new();

        self.check_duplicate_query_entries::<crate::hir::HirFunctionDefinition>(
            ctx,
            hir,
            &mut seen,
            "E1006",
            "item name",
            |definition| (definition.name.node.name.clone(), definition.name.span),
        );
        self.check_duplicate_query_entries::<crate::hir::HirModuleDeclaration>(
            ctx,
            hir,
            &mut seen,
            "E1006",
            "item name",
            |definition| (self.path_tail(&definition.path), definition.path.span),
        );
        self.check_duplicate_query_entries::<crate::hir::HirUseDeclaration>(
            ctx,
            hir,
            &mut seen,
            "E1006",
            "item name",
            |definition| (self.path_tail(&definition.path), definition.path.span),
        );
    }

    fn check_unknown_types_in_definitions(&self, ctx: &mut RuleContext, hir: &Spanned<HirProgram>) {
        let known_types = self.collect_known_type_names(hir);

        for definition in HirQuery::from(&hir.node).of::<crate::hir::HirTypeDefinition>() {
            let generic_names = self.collect_generic_names(&definition.generics);
            for field in &definition.fields {
                self.validate_type_reference(ctx, &field.node.ty, &known_types, &generic_names);
            }
        }

        for definition in HirQuery::from(&hir.node).of::<crate::hir::HirEnumDefinition>() {
            let generic_names = self.collect_generic_names(&definition.generics);
            for variant in &definition.variants {
                for field in &variant.node.fields {
                    self.validate_type_reference(ctx, &field.node.ty, &known_types, &generic_names);
                }
            }
        }

        for definition in HirQuery::from(&hir.node).of::<crate::hir::HirFunctionDefinition>() {
            let generic_names = self.collect_generic_names(&definition.generics);
            for parameter in &definition.parameters {
                self.validate_type_reference(ctx, &parameter.node.ty, &known_types, &generic_names);
            }
            if let Some(return_type) = &definition.return_type {
                self.validate_type_reference(ctx, return_type, &known_types, &generic_names);
            }
        }

        for definition in HirQuery::from(&hir.node).of::<crate::hir::HirMethodDefinition>() {
            let generic_names = HashSet::new();
            self.validate_type_reference(
                ctx,
                &definition.receiver_type,
                &known_types,
                &generic_names,
            );
            for parameter in &definition.parameters {
                self.validate_type_reference(ctx, &parameter.node.ty, &known_types, &generic_names);
            }
            if let Some(return_type) = &definition.return_type {
                self.validate_type_reference(ctx, return_type, &known_types, &generic_names);
            }
        }

        for definition in HirQuery::from(&hir.node).of::<crate::hir::HirContractDefinition>() {
            let generic_names = HashSet::new();
            for signature in
                HirQuery::from(definition).of::<crate::hir::HirContractMethodSignature>()
            {
                for parameter in &signature.parameters {
                    self.validate_type_reference(
                        ctx,
                        &parameter.node.ty,
                        &known_types,
                        &generic_names,
                    );
                }
                if let Some(return_type) = &signature.return_type {
                    self.validate_type_reference(ctx, return_type, &known_types, &generic_names);
                }
            }
        }
    }

    fn check_conflicting_embedded_contracts(
        &self,
        ctx: &mut RuleContext,
        hir: &Spanned<HirProgram>,
    ) {
        let contracts = self.collect_contract_definitions(hir);

        for definition in contracts.values() {
            let mut known_signatures = self.contract_methods(&definition.node);

            for embedding in
                HirQuery::from(&definition.node).of::<crate::hir::HirContractEmbedding>()
            {
                let embedded_name = embedding.name.node.name.clone();
                let Some(embedded_contract) = contracts.get(&embedded_name) else {
                    continue;
                };

                for (method_name, signature) in self.contract_methods(&embedded_contract.node) {
                    let Some(previous) =
                        known_signatures.insert(method_name.clone(), signature.clone())
                    else {
                        continue;
                    };
                    if previous == signature {
                        continue;
                    }

                    ctx.emit_simple(
                        embedding.name.span,
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
        hir: &'a Spanned<HirProgram>,
    ) -> HashMap<String, &'a Spanned<HirContractDefinition>> {
        let mut contracts = HashMap::new();
        for definition in hir.node.items.iter().filter_map(|item| match &item.node {
            HirItem::ContractDefinition(definition) => Some(definition),
            _ => None,
        }) {
            contracts.insert(definition.node.name.node.name.clone(), definition);
        }
        contracts
    }

    fn contract_methods(&self, definition: &HirContractDefinition) -> HashMap<String, String> {
        let mut methods = HashMap::new();
        for signature in HirQuery::from(definition).of::<crate::hir::HirContractMethodSignature>() {
            let name = signature.name.node.name.clone();
            let signature_string = self.contract_signature_string(signature);
            methods.insert(name, signature_string);
        }
        methods
    }

    fn contract_signature_string(
        &self,
        signature: &crate::hir::HirContractMethodSignature,
    ) -> String {
        let params = signature
            .parameters
            .iter()
            .map(|parameter| self.type_to_string(&parameter.node.ty))
            .collect::<Vec<_>>()
            .join(",");
        let return_type = signature
            .return_type
            .as_ref()
            .map(|ty| self.type_to_string(ty))
            .unwrap_or_else(|| "unit".to_string());
        format!("{return_type}({params})")
    }

    fn type_to_string(&self, ty: &Spanned<HirType>) -> String {
        match &ty.node {
            HirType::Primitive(primitive) => match primitive.node {
                HirPrimitiveType::Bool => "bool".to_string(),
                HirPrimitiveType::I32 => "i32".to_string(),
                HirPrimitiveType::I64 => "i64".to_string(),
                HirPrimitiveType::U8 => "u8".to_string(),
                HirPrimitiveType::F64 => "f64".to_string(),
                HirPrimitiveType::Char => "char".to_string(),
                HirPrimitiveType::String => "string".to_string(),
                HirPrimitiveType::Unit => "unit".to_string(),
            },
            HirType::Complex(path) => path
                .node
                .segments
                .iter()
                .map(|segment| segment.node.name.node.name.clone())
                .collect::<Vec<_>>()
                .join("."),
            HirType::Array(inner) => format!("{}[]", self.type_to_string(inner)),
            HirType::Ref(inner) => format!("ref {}", self.type_to_string(inner)),
        }
    }

    fn collect_known_type_names(&self, hir: &Spanned<HirProgram>) -> HashSet<String> {
        let mut known = HashSet::new();

        for primitive in ["bool", "i32", "i64", "u8", "f64", "char", "string", "unit"] {
            known.insert(primitive.to_string());
        }

        self.extend_known_type_names::<crate::hir::HirTypeDefinition>(
            hir,
            &mut known,
            |definition| definition.name.node.name.clone(),
        );
        self.extend_known_type_names::<crate::hir::HirEnumDefinition>(
            hir,
            &mut known,
            |definition| definition.name.node.name.clone(),
        );
        self.extend_known_type_names::<crate::hir::HirContractDefinition>(
            hir,
            &mut known,
            |definition| definition.name.node.name.clone(),
        );

        known
    }

    fn collect_generic_names(
        &self,
        generics: &[Spanned<crate::hir::HirIdentifier>],
    ) -> HashSet<String> {
        generics
            .iter()
            .map(|identifier| identifier.node.name.clone())
            .collect()
    }

    fn validate_type_reference(
        &self,
        ctx: &mut RuleContext,
        ty: &Spanned<HirType>,
        known_types: &HashSet<String>,
        generic_names: &HashSet<String>,
    ) {
        match &ty.node {
            HirType::Primitive(_) => {}
            HirType::Complex(path) => {
                let Some(last_segment) = path.node.segments.last() else {
                    return;
                };
                let type_name = &last_segment.node.name.node.name;
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
            HirType::Array(inner) | HirType::Ref(inner) => {
                self.validate_type_reference(ctx, inner, known_types, generic_names);
            }
        }
    }

    fn path_tail(&self, path: &Spanned<HirPath>) -> String {
        path.node
            .segments
            .last()
            .map(|segment| segment.node.name.node.name.clone())
            .unwrap_or_default()
    }

    fn check_duplicate_definition_names(&self, ctx: &mut RuleContext, hir: &Spanned<HirProgram>) {
        let mut seen: HashMap<String, SpanInfo> = HashMap::new();

        self.check_duplicate_query_entries::<crate::hir::HirTypeDefinition>(
            ctx,
            hir,
            &mut seen,
            "E1001",
            "definition name",
            |definition| (definition.name.node.name.clone(), definition.name.span),
        );
        self.check_duplicate_query_entries::<crate::hir::HirEnumDefinition>(
            ctx,
            hir,
            &mut seen,
            "E1001",
            "definition name",
            |definition| (definition.name.node.name.clone(), definition.name.span),
        );
        self.check_duplicate_query_entries::<crate::hir::HirContractDefinition>(
            ctx,
            hir,
            &mut seen,
            "E1001",
            "definition name",
            |definition| (definition.name.node.name.clone(), definition.name.span),
        );
    }

    fn check_duplicate_enum_variants(
        &self,
        ctx: &mut RuleContext,
        definition: &crate::hir::HirEnumDefinition,
    ) {
        let mut seen: HashMap<String, SpanInfo> = HashMap::new();
        for variant in HirQuery::from(definition).of::<crate::hir::HirEnumVariant>() {
            self.emit_duplicate_if_any(
                ctx,
                &mut seen,
                variant.name.node.name.clone(),
                variant.name.span,
                "E1002",
                "enum variant",
            );
        }
    }

    fn check_duplicate_contract_methods(
        &self,
        ctx: &mut RuleContext,
        definition: &crate::hir::HirContractDefinition,
    ) {
        let mut seen: HashMap<String, SpanInfo> = HashMap::new();
        for signature in HirQuery::from(definition).of::<crate::hir::HirContractMethodSignature>() {
            self.emit_duplicate_if_any(
                ctx,
                &mut seen,
                signature.name.node.name.clone(),
                signature.name.span,
                "E1003",
                "contract method",
            );
        }
    }

    fn check_duplicate_query_entries<T: HirNode + 'static>(
        &self,
        ctx: &mut RuleContext,
        hir: &Spanned<HirProgram>,
        seen: &mut HashMap<String, SpanInfo>,
        code: &str,
        subject: &str,
        name_and_span: impl Fn(&T) -> (String, SpanInfo),
    ) {
        for node in HirQuery::from(&hir.node).of::<T>() {
            let (name, span) = name_and_span(node);
            self.emit_duplicate_if_any(ctx, seen, name, span, code, subject);
        }
    }

    fn emit_duplicate_if_any(
        &self,
        ctx: &mut RuleContext,
        seen: &mut HashMap<String, SpanInfo>,
        name: String,
        span: SpanInfo,
        code: &str,
        subject: &str,
    ) {
        let Some(previous_span) = seen.insert(name.clone(), span) else {
            return;
        };

        let help = Some(format!(
            "previously defined at line {}, column {}",
            previous_span.line_col_start.0, previous_span.line_col_start.1
        ));
        ctx.emit_simple(
            span,
            code,
            format!("duplicate {subject} `{name}`"),
            format!("duplicate {subject}"),
            help,
            Severity::Error,
        );
    }

    fn extend_known_type_names<T: HirNode + 'static>(
        &self,
        hir: &Spanned<HirProgram>,
        known: &mut HashSet<String>,
        name_of: impl Fn(&T) -> String,
    ) {
        for node in HirQuery::from(&hir.node).of::<T>() {
            known.insert(name_of(node));
        }
    }
}
