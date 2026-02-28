use super::SemanticPipelineRule;
use crate::analysis::diagnostic_kinds::SemanticIssueKind;
use crate::analysis::rules::RuleContext;
use crate::hir::{HirContractNode, HirItem, HirProgram, HirType};
use crate::syntax::Spanned;
use std::collections::HashMap;

impl SemanticPipelineRule {
    pub(super) fn stage6_contracts_and_methods(
        &self,
        ctx: &mut RuleContext,
        hir: &Spanned<HirProgram>,
    ) {
        let contracts = self.collect_contract_signatures(hir);

        for item in &hir.node.items {
            let HirItem::MethodDefinition(method) = &item.node else {
                continue;
            };
            let HirType::Complex(receiver_path) = &method.node.receiver_type.node else {
                continue;
            };
            let Some(receiver_name) = receiver_path
                .node
                .segments
                .last()
                .map(|segment| segment.node.name.node.name.clone())
            else {
                continue;
            };
            let Some(expected_methods) = contracts.get(&receiver_name) else {
                continue;
            };

            let method_name = method.node.name.node.name.clone();
            let Some(expected) = expected_methods.get(&method_name) else {
                ctx.emit_issue(
                    method.node.name.span,
                    SemanticIssueKind::ContractMethodNotFound {
                        method_name,
                        receiver_name,
                    },
                );
                continue;
            };

            let actual = self.method_signature_string(
                method.node.parameters.len(),
                method.node.return_type.is_some(),
            );
            if &actual != expected {
                ctx.emit_issue(
                    method.node.name.span,
                    SemanticIssueKind::ContractImplementationSignatureMismatch {
                        method_name,
                        expected: expected.clone(),
                        actual,
                    },
                );
            }
        }

        for (contract_name, methods) in &contracts {
            for (method_name, expected) in methods {
                if self.has_contract_method_impl(hir, contract_name, method_name) {
                    continue;
                }
                let span = self
                    .contract_method_span(hir, contract_name, method_name)
                    .unwrap_or(hir.span);
                ctx.emit_issue(
                    span,
                    SemanticIssueKind::ContractMethodMissingImplementation {
                        contract_name: contract_name.clone(),
                        method_name: method_name.clone(),
                        expected: expected.clone(),
                    },
                );
            }
        }
    }

    fn collect_contract_signatures(
        &self,
        hir: &Spanned<HirProgram>,
    ) -> HashMap<String, HashMap<String, String>> {
        let mut contracts = HashMap::new();
        for item in &hir.node.items {
            let HirItem::ContractDefinition(definition) = &item.node else {
                continue;
            };

            let mut methods = HashMap::new();
            for node in &definition.node.items {
                let HirContractNode::MethodSignature(signature) = &node.node else {
                    continue;
                };
                methods.insert(
                    signature.node.name.node.name.clone(),
                    self.method_signature_string(
                        signature.node.parameters.len(),
                        signature.node.return_type.is_some(),
                    ),
                );
            }
            contracts.insert(definition.node.name.node.name.clone(), methods);
        }
        contracts
    }

    fn has_contract_method_impl(
        &self,
        hir: &Spanned<HirProgram>,
        contract_name: &str,
        method_name: &str,
    ) -> bool {
        for item in &hir.node.items {
            let HirItem::MethodDefinition(method) = &item.node else {
                continue;
            };
            let HirType::Complex(receiver_path) = &method.node.receiver_type.node else {
                continue;
            };
            let Some(receiver_name) = receiver_path
                .node
                .segments
                .last()
                .map(|segment| segment.node.name.node.name.as_str())
            else {
                continue;
            };
            if receiver_name == contract_name && method.node.name.node.name == method_name {
                return true;
            }
        }
        false
    }

    fn contract_method_span(
        &self,
        hir: &Spanned<HirProgram>,
        contract_name: &str,
        method_name: &str,
    ) -> Option<crate::syntax::SpanInfo> {
        for item in &hir.node.items {
            let HirItem::ContractDefinition(definition) = &item.node else {
                continue;
            };
            if definition.node.name.node.name != contract_name {
                continue;
            }
            for node in &definition.node.items {
                let HirContractNode::MethodSignature(signature) = &node.node else {
                    continue;
                };
                if signature.node.name.node.name == method_name {
                    return Some(signature.node.name.span);
                }
            }
        }
        None
    }

    fn method_signature_string(&self, parameter_count: usize, has_return_type: bool) -> String {
        let return_marker = if has_return_type { "ret" } else { "unit" };
        format!("{return_marker}({parameter_count})")
    }
}
