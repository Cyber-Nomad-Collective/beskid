use super::SemanticPipelineRule;
use crate::analysis::Severity;
use crate::analysis::rules::RuleContext;
use crate::hir::{HirBlock, HirExpressionNode, HirItem, HirPattern, HirProgram, HirStatementNode};
use crate::query::{HirNodeRef, HirQuery, HirVisit, HirWalker};
use crate::syntax::Spanned;
use std::collections::{HashMap, HashSet};

impl SemanticPipelineRule {
    pub(super) fn stage3_control_flow_and_patterns(
        &self,
        ctx: &mut RuleContext,
        hir: &Spanned<HirProgram>,
    ) {
        let enum_variants = self.collect_enum_variants(hir);
        let variant_to_enum = self.collect_variant_to_enum(hir);

        let mut walker = HirWalker::new().with_visitor(Box::new(ControlFlowVisitor::new(
            self,
            ctx,
            &enum_variants,
            &variant_to_enum,
        )));

        for item in &hir.node.items {
            match &item.node {
                HirItem::FunctionDefinition(definition) => {
                    walker.walk(HirNodeRef::from(&definition.node.body.node));
                }
                HirItem::MethodDefinition(definition) => {
                    walker.walk(HirNodeRef::from(&definition.node.body.node));
                }
                _ => {}
            }
        }
    }

    fn collect_variant_to_enum(&self, hir: &Spanned<HirProgram>) -> HashMap<String, String> {
        let mut result = HashMap::new();
        for item in &hir.node.items {
            let HirItem::EnumDefinition(definition) = &item.node else {
                continue;
            };
            let enum_name = definition.node.name.node.name.clone();
            for variant in HirQuery::from(&definition.node).of::<crate::hir::HirEnumVariant>() {
                result.insert(variant.name.node.name.clone(), enum_name.clone());
            }
        }
        result
    }

    fn collect_enum_variants(
        &self,
        hir: &Spanned<HirProgram>,
    ) -> HashMap<String, HashMap<String, usize>> {
        let mut result = HashMap::new();

        for item in &hir.node.items {
            let HirItem::EnumDefinition(definition) = &item.node else {
                continue;
            };

            let mut variants = HashMap::new();
            for variant in HirQuery::from(&definition.node).of::<crate::hir::HirEnumVariant>() {
                variants.insert(variant.name.node.name.clone(), variant.fields.len());
            }
            result.insert(definition.node.name.node.name.clone(), variants);
        }

        result
    }

    fn check_match_semantics(
        &self,
        ctx: &mut RuleContext,
        match_expression: &Spanned<crate::hir::HirMatchExpression>,
        enum_variants: &HashMap<String, HashMap<String, usize>>,
    ) {
        let mut arm_kind: Option<&'static str> = None;
        let mut wildcard_seen = false;
        let mut enum_name: Option<String> = None;
        let mut covered_variants = HashSet::new();

        for arm in &match_expression.node.arms {
            if let Some(guard) = &arm.node.guard
                && !self.is_boolean_like_guard(guard)
            {
                ctx.emit_simple(
                    guard.span,
                    "E1308",
                    "match guard must be boolean",
                    "guard type mismatch",
                    None,
                    Severity::Error,
                );
            }

            if let Some(kind) = self.literal_kind(&arm.node.value) {
                if let Some(previous_kind) = arm_kind {
                    if previous_kind != kind {
                        ctx.emit_simple(
                            arm.node.value.span,
                            "E1305",
                            "match arm type mismatch",
                            "match arm type mismatch",
                            Some(format!("expected `{previous_kind}`, got `{kind}`")),
                            Severity::Error,
                        );
                    }
                } else {
                    arm_kind = Some(kind);
                }
            }

            match &arm.node.pattern.node {
                HirPattern::Wildcard => wildcard_seen = true,
                HirPattern::Enum(enum_pattern) => {
                    let current_enum = enum_pattern.node.path.node.type_name.node.name.clone();
                    let current_variant = enum_pattern.node.path.node.variant.node.name.clone();
                    covered_variants.insert(current_variant);
                    if let Some(existing) = &enum_name {
                        if existing != &current_enum {
                            enum_name = None;
                        }
                    } else {
                        enum_name = Some(current_enum);
                    }
                }
                _ => {
                    enum_name = None;
                }
            }
        }

        if wildcard_seen {
            return;
        }
        let Some(enum_name) = enum_name else {
            return;
        };
        let Some(variants) = enum_variants.get(&enum_name) else {
            return;
        };
        if variants
            .keys()
            .all(|variant| covered_variants.contains(variant))
        {
            return;
        }

        ctx.emit_simple(
            match_expression.span,
            "E1304",
            format!("non-exhaustive match on enum `{enum_name}`"),
            "match non-exhaustive",
            None,
            Severity::Error,
        );
    }

    fn is_boolean_like_guard(&self, expression: &Spanned<HirExpressionNode>) -> bool {
        match &expression.node {
            HirExpressionNode::LiteralExpression(literal) => {
                matches!(literal.node.literal.node, crate::hir::HirLiteral::Bool(_))
            }
            HirExpressionNode::UnaryExpression(unary_expression) => {
                self.is_boolean_like_guard(&unary_expression.node.expr)
            }
            HirExpressionNode::BinaryExpression(binary_expression) => {
                self.is_boolean_like_guard(&binary_expression.node.left)
                    || self.is_boolean_like_guard(&binary_expression.node.right)
            }
            HirExpressionNode::GroupedExpression(grouped_expression) => {
                self.is_boolean_like_guard(&grouped_expression.node.expr)
            }
            _ => true,
        }
    }

    fn literal_kind(&self, expression: &Spanned<HirExpressionNode>) -> Option<&'static str> {
        match &expression.node {
            HirExpressionNode::LiteralExpression(literal) => match &literal.node.literal.node {
                crate::hir::HirLiteral::Integer(_) => Some("int"),
                crate::hir::HirLiteral::Float(_) => Some("float"),
                crate::hir::HirLiteral::String(_) => Some("string"),
                crate::hir::HirLiteral::Char(_) => Some("char"),
                crate::hir::HirLiteral::Bool(_) => Some("bool"),
            },
            HirExpressionNode::GroupedExpression(grouped_expression) => {
                self.literal_kind(&grouped_expression.node.expr)
            }
            _ => None,
        }
    }

    fn collect_pattern_bindings(
        &self,
        ctx: &mut RuleContext,
        pattern: &Spanned<HirPattern>,
        names: &mut HashSet<String>,
        enum_variants: &HashMap<String, HashMap<String, usize>>,
    ) {
        match &pattern.node {
            HirPattern::Identifier(identifier) => {
                let name = identifier.node.name.clone();
                if names.insert(name.clone()) {
                    return;
                }

                ctx.emit_simple(
                    identifier.span,
                    "E1306",
                    format!("duplicate pattern binding `{name}`"),
                    "duplicate pattern binding",
                    None,
                    Severity::Error,
                );
            }
            HirPattern::Enum(enum_pattern) => {
                let enum_name = enum_pattern.node.path.node.type_name.node.name.clone();
                let variant_name = enum_pattern.node.path.node.variant.node.name.clone();
                let Some(variants) = enum_variants.get(&enum_name) else {
                    ctx.emit_simple(
                        enum_pattern.node.path.span,
                        "E1301",
                        format!("unknown enum path `{enum_name}::{variant_name}`"),
                        "unknown enum path",
                        None,
                        Severity::Error,
                    );
                    return;
                };

                let Some(expected_arity) = variants.get(&variant_name) else {
                    ctx.emit_simple(
                        enum_pattern.node.path.span,
                        "E1301",
                        format!("unknown enum path `{enum_name}::{variant_name}`"),
                        "unknown enum path",
                        None,
                        Severity::Error,
                    );
                    return;
                };

                if enum_pattern.node.items.len() != *expected_arity {
                    ctx.emit_simple(
                        enum_pattern.span,
                        "E1307",
                        format!(
                            "pattern arity mismatch: expected {}, got {}",
                            expected_arity,
                            enum_pattern.node.items.len()
                        ),
                        "pattern arity mismatch",
                        None,
                        Severity::Error,
                    );
                }

                for item in &enum_pattern.node.items {
                    self.collect_pattern_bindings(ctx, item, names, enum_variants);
                }
            }
            HirPattern::Wildcard | HirPattern::Literal(_) => {}
        }
    }
}

struct ControlFlowVisitor<'a> {
    rule: &'a SemanticPipelineRule,
    ctx: &'a mut RuleContext,
    loop_depth: usize,
    enum_variants: &'a HashMap<String, HashMap<String, usize>>,
    variant_to_enum: &'a HashMap<String, String>,
}

impl<'a> ControlFlowVisitor<'a> {
    fn new(
        rule: &'a SemanticPipelineRule,
        ctx: &'a mut RuleContext,
        enum_variants: &'a HashMap<String, HashMap<String, usize>>,
        variant_to_enum: &'a HashMap<String, String>,
    ) -> Self {
        Self {
            rule,
            ctx,
            loop_depth: 0,
            enum_variants,
            variant_to_enum,
        }
    }

    fn scan_unreachable_in_block(&mut self, block: &HirBlock) {
        let mut terminated = false;
        for statement in &block.statements {
            if terminated {
                self.ctx.emit_simple(
                    statement.span,
                    "W1403",
                    "unreachable code",
                    "unreachable statement",
                    Some(
                        "remove this statement or move it before the terminating statement"
                            .to_string(),
                    ),
                    Severity::Warning,
                );
                continue;
            }
            terminated = self.statement_terminates(statement);
        }
    }

    fn statement_terminates(&mut self, statement: &Spanned<HirStatementNode>) -> bool {
        match &statement.node {
            HirStatementNode::ReturnStatement(_) => true,
            HirStatementNode::BreakStatement(_) => {
                if self.loop_depth == 0 {
                    self.ctx.emit_simple(
                        statement.span,
                        "E1401",
                        "break used outside loop",
                        "break outside loop",
                        None,
                        Severity::Error,
                    );
                    false
                } else {
                    true
                }
            }
            HirStatementNode::ContinueStatement(_) => {
                if self.loop_depth == 0 {
                    self.ctx.emit_simple(
                        statement.span,
                        "E1402",
                        "continue used outside loop",
                        "continue outside loop",
                        None,
                        Severity::Error,
                    );
                    false
                } else {
                    true
                }
            }
            HirStatementNode::LetStatement(_)
            | HirStatementNode::WhileStatement(_)
            | HirStatementNode::ForStatement(_)
            | HirStatementNode::IfStatement(_)
            | HirStatementNode::ExpressionStatement(_) => false,
        }
    }

    fn check_call_expression(&mut self, call_expression: &Spanned<crate::hir::HirCallExpression>) {
        if let HirExpressionNode::PathExpression(path_expression) =
            &call_expression.node.callee.node
            && path_expression.node.path.node.segments.len() == 1
            && let Some(name) = path_expression.node.path.node.segments.first()
        {
            let name_value = &name.node.name.node.name;
            if let Some(enum_name) = self.variant_to_enum.get(name_value) {
                self.ctx.emit_simple(
                    path_expression.node.path.span,
                    "E1303",
                    format!(
                        "unqualified enum constructor `{}`; use `{}::{}`",
                        name_value, enum_name, name_value
                    ),
                    "unqualified enum constructor",
                    None,
                    Severity::Error,
                );
            }
        }
    }

    fn check_enum_constructor_expression(
        &mut self,
        constructor_expression: &Spanned<crate::hir::HirEnumConstructorExpression>,
    ) {
        let enum_name = constructor_expression
            .node
            .path
            .node
            .type_name
            .node
            .name
            .clone();
        let variant_name = constructor_expression
            .node
            .path
            .node
            .variant
            .node
            .name
            .clone();
        let Some(variants) = self.enum_variants.get(&enum_name) else {
            self.ctx.emit_simple(
                constructor_expression.node.path.span,
                "E1301",
                format!("unknown enum path `{enum_name}::{variant_name}`"),
                "unknown enum path",
                None,
                Severity::Error,
            );
            return;
        };

        let Some(expected_arity) = variants.get(&variant_name) else {
            self.ctx.emit_simple(
                constructor_expression.node.path.span,
                "E1301",
                format!("unknown enum path `{enum_name}::{variant_name}`"),
                "unknown enum path",
                None,
                Severity::Error,
            );
            return;
        };

        if constructor_expression.node.args.len() != *expected_arity {
            self.ctx.emit_simple(
                constructor_expression.span,
                "E1302",
                format!(
                    "enum constructor arity mismatch: expected {}, got {}",
                    expected_arity,
                    constructor_expression.node.args.len()
                ),
                "enum constructor arity mismatch",
                None,
                Severity::Error,
            );
        }
    }

    fn check_match_expression(
        &mut self,
        match_expression: &Spanned<crate::hir::HirMatchExpression>,
    ) {
        for arm in &match_expression.node.arms {
            let mut names = HashSet::new();
            self.rule.collect_pattern_bindings(
                self.ctx,
                &arm.node.pattern,
                &mut names,
                self.enum_variants,
            );
        }
        self.rule
            .check_match_semantics(self.ctx, match_expression, self.enum_variants);
    }
}

impl HirVisit for ControlFlowVisitor<'_> {
    fn enter(&mut self, node: HirNodeRef<'_>) {
        if let Some(statement) = node.of::<HirStatementNode>() {
            match statement {
                HirStatementNode::WhileStatement(_) | HirStatementNode::ForStatement(_) => {
                    self.loop_depth += 1;
                }
                _ => {}
            }
        }

        if let Some(block) = node.of::<HirBlock>() {
            self.scan_unreachable_in_block(block);
        }

        if let Some(expression) = node.of::<HirExpressionNode>() {
            match expression {
                HirExpressionNode::MatchExpression(match_expression) => {
                    self.check_match_expression(match_expression)
                }
                HirExpressionNode::CallExpression(call_expression) => {
                    self.check_call_expression(call_expression)
                }
                HirExpressionNode::EnumConstructorExpression(constructor_expression) => {
                    self.check_enum_constructor_expression(constructor_expression)
                }
                _ => {}
            }
        }
    }

    fn exit(&mut self, node: HirNodeRef<'_>) {
        if let Some(statement) = node.of::<HirStatementNode>() {
            match statement {
                HirStatementNode::WhileStatement(_) | HirStatementNode::ForStatement(_) => {
                    self.loop_depth = self.loop_depth.saturating_sub(1);
                }
                _ => {}
            }
        }
    }
}
